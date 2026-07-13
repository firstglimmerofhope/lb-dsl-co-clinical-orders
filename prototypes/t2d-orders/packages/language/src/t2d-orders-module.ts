import { inject, type Module } from "langium";
import {
  createDefaultModule,
  createDefaultSharedModule,
  type DefaultSharedModuleContext,
  type LangiumServices,
  type LangiumSharedServices,
  type PartialLangiumServices,
} from "langium/lsp";
import {
  T2DOrdersGeneratedModule,
  T2DOrdersGeneratedSharedModule,
} from "./generated/module.js";
import {
  T2DOrdersValidator,
  registerValidationChecks,
} from "./t2d-orders-validator.js";

export type T2DOrdersAddedServices = {
  validation: {
    T2DOrdersValidator: T2DOrdersValidator;
  };
};

export type T2DOrdersServices = LangiumServices & T2DOrdersAddedServices;

export const T2DOrdersModule: Module<
  T2DOrdersServices,
  PartialLangiumServices & T2DOrdersAddedServices
> = {
  validation: {
    T2DOrdersValidator: () => new T2DOrdersValidator(),
  },
};

export function createT2DOrdersServices(context: DefaultSharedModuleContext): {
  shared: LangiumSharedServices;
  T2DOrders: T2DOrdersServices;
} {
  const shared = inject(
    createDefaultSharedModule(context),
    T2DOrdersGeneratedSharedModule,
  );
  const T2DOrders = inject(
    createDefaultModule({ shared }),
    T2DOrdersGeneratedModule,
    T2DOrdersModule,
  );
  registerValidationChecks(T2DOrders);
  return { shared, T2DOrders };
}
