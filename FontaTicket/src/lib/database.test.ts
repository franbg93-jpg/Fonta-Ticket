import { beforeEach, describe, expect, it } from "vitest";
import { applyCatalogPriceProposal, clearAppointments, clearProducts, clearTickets, deleteAppointment, deleteProduct, deleteTicket, getAppointments, getProducts, getTickets, replaceProducts, saveAppointment, saveProduct, saveTicket } from "./database";
import { buildPriceUpdateProposal } from "./catalog-price-updates.mjs";
import type { Appointment, Product, Ticket } from "../types";

describe("local database", () => {
  beforeEach(async () => {
    await replaceProducts([]);
    for (const ticket of await getTickets()) await deleteTicket(ticket.id);
    for (const appointment of await getAppointments()) await deleteAppointment(appointment.id);
  });

  it("persists catalog and history independently", async () => {
    const product: Product = { id: "p1", reference: "REF", nombre: "Grifo", precio: 8, foto: null };
    const ticket: Ticket = {
      id: "t1",
      createdAt: "2026-01-01T10:00:00.000Z",
      lines: [{ id: "l1", description: "Grifo", reference: "REF", unitPrice: 8, quantity: 1 }],
      total: 8,
    };
    await replaceProducts([product]);
    await saveTicket(ticket);
    expect(await getProducts()).toEqual([product]);
    expect(await getTickets()).toEqual([ticket]);

    await clearProducts();
    expect(await getProducts()).toEqual([]);
    expect(await getTickets()).toEqual([ticket]);
  });

  it("updates the same product record, including its stored photo", async () => {
    const product: Product = { id: "p1", reference: "REF", nombre: "Grifo", precio: 8, foto: null };
    await saveProduct(product);
    await saveProduct({ ...product, nombre: "Grifo nuevo", precio: 9, foto: "data:image/png;base64,aGVsbG8=" });
    expect(await getProducts()).toEqual([
      { ...product, nombre: "Grifo nuevo", precio: 9, foto: "data:image/png;base64,aGVsbG8=" },
    ]);
  });

  it("persists grouped variants and their image associations in the catalog", async () => {
    const product: Product = {
      id: "grouped",
      reference: "GRUPO",
      nombre: "Válvula",
      precio: null,
      foto: "data:image/png;base64,cHJvZHVjdA==",
      category: "VÁLVULAS",
      supplier: "Tecnoagua",
      variants: [{
        id: "variant-1",
        reference: "VAL-15",
        price: 3.5,
        description: "15 mm",
        photo: "data:image/jpeg;base64,dmFyaWFudGU=",
        attributes: { medida: "15 mm", tipo: "Cobre" },
      }],
    };

    await saveProduct(product);

    expect(await getProducts()).toEqual([product]);
  });

  it("applies a price proposal in one catalog transaction without changing other product data", async () => {
    const grouped: Product = {
      id: "grouped",
      reference: "SERIE-GENERICA",
      nombre: "Codo multicapa",
      precio: null,
      foto: "data:image/png;base64,cGFyZW50",
      supplier: "Obramat",
      variants: [{
        id: "variante-16",
        reference: "MODEL-16",
        supplierReference: "25001001",
        price: 2.6,
        sourcePrice: 2,
        priceMethod: "Obramat x1.30",
        photo: "data:image/jpeg;base64,dmFyaWFudGU=",
        attributes: { Medida: "16 mm", Conexión: "Hembra" },
      }],
    };
    const untouched: Product = { id: "other", reference: "X", nombre: "Otro", precio: 5, foto: null };
    await replaceProducts([grouped, untouched]);
    const proposal = buildPriceUpdateProposal([grouped, untouched], {
      supplier: "Obramat",
      priceDate: "2026-10-07",
      sourceUrl: "https://www.obramat.es/productos/ref-25001001.html",
      rows: [{ supplierReference: "25001001", sourcePrice: 2.4, priceUnit: "unidad", priceIncludesVat: true, sourceUrl: "https://www.obramat.es/productos/ref-25001001.html" }],
    });

    const result = await applyCatalogPriceProposal(proposal);

    expect(result.applied).toBe(1);
    expect(result.products.find((product) => product.id === "grouped")).toMatchObject({
      reference: "SERIE-GENERICA",
      nombre: "Codo multicapa",
      foto: grouped.foto,
      variants: [{
        reference: "MODEL-16",
        supplier: "Obramat",
        supplierReference: "25001001",
        price: 3.12,
        sourcePrice: 2.4,
        photo: grouped.variants?.[0].photo,
        attributes: grouped.variants?.[0].attributes,
      }],
    });
    expect(result.products.find((product) => product.id === "other")).toEqual(untouched);
    expect(await getProducts()).toEqual(result.products);
  });

  it("deleting a catalog product does not modify ticket history", async () => {
    const product: Product = { id: "p1", reference: "REF", nombre: "Grifo", precio: 8, foto: null };
    const ticket: Ticket = {
      id: "t1",
      createdAt: "2026-01-01T10:00:00.000Z",
      lines: [{ id: "l1", description: "Grifo", reference: "REF", unitPrice: 8, quantity: 1 }],
      total: 8,
    };
    await replaceProducts([product]);
    await saveTicket(ticket);

    await deleteProduct(product.id);

    expect(await getProducts()).toEqual([]);
    expect(await getTickets()).toEqual([ticket]);
  });

  it("clearing all ticket history leaves the catalog unchanged", async () => {
    const product: Product = { id: "p1", reference: "REF", nombre: "Grifo", precio: 8, foto: null };
    const ticket: Ticket = {
      id: "t1",
      createdAt: "2026-01-01T10:00:00.000Z",
      lines: [{ id: "l1", description: "Grifo", reference: "REF", unitPrice: 8, quantity: 1 }],
      total: 8,
    };
    await replaceProducts([product]);
    await saveTicket(ticket);

    await clearTickets();

    expect(await getProducts()).toEqual([product]);
    expect(await getTickets()).toEqual([]);
  });

  it("persists and clears the pending payment flag with its ticket", async () => {
    const ticket: Ticket = {
      id: "t1",
      createdAt: "2026-01-01T10:00:00.000Z",
      lines: [{ id: "l1", description: "Grifo", unitPrice: 8, quantity: 1 }],
      total: 8,
    };
    await saveTicket(ticket);

    await saveTicket({ ...ticket, pendingPayment: true });
    expect(await getTickets()).toEqual([{ ...ticket, pendingPayment: true }]);

    const paidTicket = { ...ticket };
    await saveTicket(paidTicket);
    expect(await getTickets()).toEqual([ticket]);
  });

  it("persists agenda appointments and updates material checkboxes with the appointment", async () => {
    const appointment: Appointment = {
      id: "a1",
      client: "Ana",
      date: "2026-10-03",
      time: "09:30",
      address: "Calle Mayor",
      work: "Reparar grifo",
      materials: [{ id: "m1", name: "Junta", acquired: false }],
    };
    await saveAppointment(appointment);
    await saveAppointment({
      ...appointment,
      materials: [{ ...appointment.materials[0], acquired: true }],
    });

    expect(await getAppointments()).toEqual([{
      ...appointment,
      materials: [{ ...appointment.materials[0], acquired: true }],
    }]);

    await deleteAppointment(appointment.id);
    expect(await getAppointments()).toEqual([]);
  });

  it("clears all appointments without changing catalog or ticket history", async () => {
    const product: Product = { id: "p1", reference: "REF", nombre: "Grifo", precio: 8, foto: null };
    const ticket: Ticket = {
      id: "t1",
      createdAt: "2026-01-01T10:00:00.000Z",
      lines: [{ id: "l1", description: "Grifo", reference: "REF", unitPrice: 8, quantity: 1 }],
      total: 8,
    };
    const appointment: Appointment = {
      id: "a1",
      client: "Ana",
      date: "2026-10-03",
      time: "09:30",
      address: "Calle Mayor",
      work: "Reparar grifo",
      materials: [],
    };
    await replaceProducts([product]);
    await saveTicket(ticket);
    await saveAppointment(appointment);

    await clearAppointments();

    expect(await getAppointments()).toEqual([]);
    expect(await getProducts()).toEqual([product]);
    expect(await getTickets()).toEqual([ticket]);
  });
});
