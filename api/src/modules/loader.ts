import { readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import type { FastifyInstance } from 'fastify';
import type { ModuleManifest } from '../types/module.types';
import { logger } from '../helpers/logger.helper';
import { prisma } from '../db';

const modulesDir = resolve(__dirname, '../../modules');

interface LoadedModule {
  manifest: ModuleManifest
  dir: string
}

const loadedModules: LoadedModule[] = [];

function findManifests(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name, 'manifest.ts'))
    .filter((p) => existsSync(p));
}

export async function loadModules(server: FastifyInstance): Promise<LoadedModule[]> {
  const manifestPaths = findManifests(modulesDir);

  for (const manifestPath of manifestPaths) {
    try {
      const mod = await import(manifestPath);
      const manifest: ModuleManifest = mod.default || mod;

      if (!manifest.key || !manifest.name || !manifest.api?.routes) {
        logger.warn({ manifestPath }, 'Module manifest missing required fields, skipping');
        continue;
      }

      logger.info({ key: manifest.key, name: manifest.name }, 'Loading module');

      loadedModules.push({ manifest, dir: manifestPath.replace('/manifest.ts', '') });
    } catch (err) {
      logger.error({ err, manifestPath }, 'Failed to load module manifest');
    }
  }

  return loadedModules;
}

export async function syncModuleRecords(): Promise<void> {
  for (const mod of loadedModules) {
    try {
      const existing = await prisma.module.findUnique({ where: { key: mod.manifest.key } });
      const existingWidgets = ((existing?.config as any)?.widgets) || {};

      const widgetConfig: Record<string, { name: string; enabled: boolean; requiredPermission: string }> = {};
      for (const w of mod.manifest.widgets || []) {
        widgetConfig[w.key] = {
          name: w.name,
          enabled: existingWidgets[w.key]?.enabled ?? w.defaultEnabled,
          requiredPermission: w.requiredPermission,
        };
      }

      await prisma.module.upsert({
        where: { key: mod.manifest.key },
        update: {
          name: mod.manifest.name,
          description: mod.manifest.description,
          icon: mod.manifest.icon || '📦',
          config: { widgets: widgetConfig },
        },
        create: {
          key: mod.manifest.key,
          name: mod.manifest.name,
          description: mod.manifest.description,
          icon: mod.manifest.icon || '📦',
          route: `/modules/${mod.manifest.key}`,
          enabled: true,
          order: 0,
          config: { widgets: widgetConfig },
        },
      });
      logger.info({ key: mod.manifest.key }, 'Module record synced to DB');
    } catch (err) {
      logger.error({ err, key: mod.manifest.key }, 'Failed to sync module record');
    }
  }
}

export async function syncModulePermissions(): Promise<void> {
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

  for (const mod of loadedModules) {
    for (const ep of mod.manifest.entityPermissions) {
      for (const permName of [ep.create, ep.read, ep.edit, ep.delete]) {
        if (!permName) continue;
        try {
          const perm = await prisma.permission.upsert({
            where: { name: permName },
            update: {},
            create: { name: permName, description: `${mod.manifest.name}: ${permName}` },
          });

          if (adminRole) {
            const exists = await prisma.rolePermission.findUnique({
              where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
            });
            if (!exists) {
              await prisma.rolePermission.create({
                data: { roleId: adminRole.id, permissionId: perm.id },
              });
            }
          }
        } catch (err) {
          logger.error({ err, key: mod.manifest.key, perm: permName }, 'Failed to sync permission');
        }
      }
    }
  }
}

export async function registerModuleRoutes(server: FastifyInstance): Promise<void> {
  for (const mod of loadedModules) {
    try {
      const routePath = join(mod.dir, mod.manifest.api.routes.replace('./', ''));
      const routeMod = await import(routePath);

      if (typeof routeMod.default === 'function') {
        await server.register(routeMod.default, { prefix: mod.manifest.api.prefix });
      } else {
        logger.warn({ key: mod.manifest.key }, 'Module routes file must have a default export as a Fastify plugin');
      }
    } catch (err) {
      logger.error({ err, key: mod.manifest.key }, 'Failed to register module routes');
    }
  }
}

export function getLoadedModules(): LoadedModule[] {
  return loadedModules;
}
