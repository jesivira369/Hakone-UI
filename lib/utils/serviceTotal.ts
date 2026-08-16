interface HasParts {
  price: number;
  parts?: { quantity: number; unitPrice: number }[] | null;
}

/**
 * `price` es la mano de obra; los repuestos se cargan aparte.
 * Lo que se le cobra al cliente es la suma de ambos, así que cualquier lugar
 * que muestre "el total" de un servicio debe pasar por acá.
 */
export function partsTotal(service: HasParts): number {
  return (service.parts ?? []).reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
}

export function serviceTotal(service: HasParts): number {
  return service.price + partsTotal(service);
}
