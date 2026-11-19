import { Injectable, Type, RequestMethod } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import {
  PATH_METADATA,
  METHOD_METADATA,
  GUARDS_METADATA,
} from '@nestjs/common/constants';
import { DECORATORS } from '@nestjs/swagger/dist/constants';

type CustomRoute = {
  route: string;
  name: string;
  method: string;
  description: string;
  module: string;
  guards: string;
  hidden?: string[];
};

@Injectable()
export class RoutesService {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  private readonly allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  getRoutes(role?: string): CustomRoute[] {
    let routes: CustomRoute[] = [];
    for (const [, moduleRef] of this.modulesContainer.entries()) {
      for (const controllerWrapper of moduleRef.controllers.values()) {
        const controller = controllerWrapper.metatype as Type<any>;
        const controllerPath = Reflect.getMetadata(PATH_METADATA, controller);

        if (!controllerPath) continue;

        const prototype = controller.prototype;
        const methodNames = Object.getOwnPropertyNames(prototype).filter(
          (method) => {
            const routePath = Reflect.getMetadata(
              PATH_METADATA,
              prototype[method],
            );
            return routePath !== undefined;
          },
        );

        for (const method of methodNames) {
          const route = this.createCustomRoute(
            prototype,
            method,
            controllerPath,
            moduleRef.metatype?.name || '',
          );
          if (route) {
            routes.push(route);
          }
        }
      }
    }

    return routes;
  }

  private createCustomRoute(
    prototype: any,
    method: string,
    controllerPath: string,
    moduleName: string,
  ): CustomRoute | null {
    const methodPath = Reflect.getMetadata(PATH_METADATA, prototype[method]);
    const requestMethod: RequestMethod = Reflect.getMetadata(
      METHOD_METADATA,
      prototype[method],
    );
    const guards = Reflect.getMetadata(GUARDS_METADATA, prototype[method]);
    const methodSummary = Reflect.getMetadata(
      DECORATORS.API_OPERATION,
      prototype[method],
    );

    const httpMethod = RequestMethod[requestMethod];
    if (!this.allowedMethods.includes(httpMethod)) return null;

    if (!guards || guards.length === 0) return null;

    const guardNames = guards.map((g) =>
      typeof g === 'function' ? g.name : g.constructor.name,
    );

    const fullPath = `/${controllerPath}/${methodPath}`.replace(/\/+/g, '/');

    return {
      route: fullPath,
      name: methodSummary?.summary ?? this.formatName(method),
      method: httpMethod,
      description: methodSummary?.description ?? '',
      module: this.formatModuleName(moduleName),
      guards: guardNames,
      hidden: methodSummary?.tags,
    };
  }

  private formatName(method: string): string {
    return method
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, (str) => str.toUpperCase());
  }

  private formatModuleName(moduleName: string): string {
    return moduleName
      .replace(/Module$/, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  }
}
