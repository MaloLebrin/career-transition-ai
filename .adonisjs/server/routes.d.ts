import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'employees.store': { paramsTuple?: []; params?: {} }
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'employees.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'exercise_results.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'employees.index': { paramsTuple?: []; params?: {} }
    'employees.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'employees.store': { paramsTuple?: []; params?: {} }
    'exercise_results.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'employees.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}