"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tab,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EmailIcon from "@mui/icons-material/Email";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptIcon from "@mui/icons-material/Receipt";
import Link from "next/link";
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import {
  canGenerateProforma,
  getProposalStatusColor,
  getProposalStatusLabel,
  getProposalTypeLabel,
} from "@/shared/utils/proposalLabels";
import { PageToolbar, ResponsiveTable, ScrollableTabs, ClearableNumberField } from "@/shared/ui";
import { useConfirmDialog } from "@/shared/hooks/useConfirmDialog";
import {
  lineNetTotal,
  normalizeUnit,
  parsePackaging,
} from "@/features/admin/utils/lineItemMath";
import {
  getMaterialLineStatusColor,
  getMaterialLineStatusLabel,
  invoiceRemainingQty,
  orderRemainingQty,
  type MaterialLineStatus,
} from "@/features/admin/utils/materialLineStatus";
import { BudgetLineRow } from "@/features/admin/components/BudgetLineRow";
import {
  BudgetProductCell,
  type BudgetProductOption,
} from "@/features/admin/components/BudgetProductCell";
import {
  BudgetLineTransferDialog,
  type TransferTarget,
} from "@/features/admin/components/BudgetLineTransferDialog";
import { BudgetLineTransferMenu } from "@/features/admin/components/BudgetLineTransferMenu";
import { formatCurrency } from "@/shared/utils/money";
import {
  BudgetClientForm,
  buildClientProfileData,
  clientFormHasChanges,
  clientToFormValues,
  emptyBudgetClientForm,
  type BudgetClientFormValues,
} from "@/features/admin/components/BudgetClientForm";
import { adminApiUrl } from "@/features/admin/utils/adminApi";

interface Material {
  id: string;
  productSku: string;
  productName: string;
  unit: string;
  quantity: number;
  orderedQuantity: number;
  invoicedQuantity: number;
  supplierOrderedQuantity: number;
  orderInvoicedQuantity: number;
  suggestedPrice: number;
  discountPct: number;
  sectionId: string | null;
  externalComment?: string | null;
  internalComment?: string | null;
  piecesPerBox: number | null;
  unitPerPiece: number | null;
  lineStatus: MaterialLineStatus;
  canOrder: boolean;
  canCreateSupplierOrder: boolean;
  canInvoice: boolean;
}

interface Section {
  id: string;
  name: string;
  sortOrder: number;
}

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  taxRate?: number | null;
  taxExempt?: boolean;
  country?: string;
  profileData?: Record<string, unknown> | null;
}

interface Proposal {
  id: string;
  type: string;
  status: string;
  laborCost: number;
  message: string | null;
  title: string | null;
  taxRate: number | null;
  client?: ClientInfo;
  sections?: Section[];
}

interface Comment {
  id: string;
  content: string;
  visibility: "client" | "internal";
  createdAt: string;
  author?: { name: string; email: string };
}

type ActionKey =
  | "save"
  | "ready"
  | "email"
  | "pdf"
  | "order"
  | "transfer"
  | "comment"
  | "client"
  | "createClient";

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (data.message) return data.message;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

function getWorkflowStep(status: string): number {
  if (status === "solicitud_submitted" || status === "pending") return 1;
  if (status === "proforma_ready") return 2;
  if (status === "signed") return 3;
  if (status === "rejected") return 0;
  return 0;
}

type ProductPackagingLookup = {
  piecesPerBox: number | null;
  unitPerPiece: number | null;
  unit: string;
  pvpPrice: number;
};

/** Checkbox | Producto | qty | Ud | Pedido | Estado | Precio | Dto | Subtotal | actions */
const DETAIL_COMMENTS_COLSPAN = 10;

function newLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyMaterial(sectionId: string | null): Material {
  return {
    id: newLocalId("line"),
    productSku: "",
    productName: "",
    unit: "unidad",
    quantity: 1,
    orderedQuantity: 0,
    invoicedQuantity: 0,
    supplierOrderedQuantity: 0,
    orderInvoicedQuantity: 0,
    suggestedPrice: 0,
    discountPct: 0,
    sectionId,
    externalComment: "",
    internalComment: "",
    piecesPerBox: null,
    unitPerPiece: null,
    lineStatus: "pending",
    canOrder: true,
    canCreateSupplierOrder: true,
    canInvoice: true,
  };
}

export function AdminBudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const { config, market } = useAdminMarket();
  const { confirm, ConfirmDialogHost } = useConfirmDialog();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [products, setProducts] = useState<BudgetProductOption[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTab, setCommentTab] = useState<"client" | "internal">("client");
  const [newComment, setNewComment] = useState("");
  const [title, setTitle] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<ActionKey | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<TransferTarget>("order");
  const [transferMaterialIds, setTransferMaterialIds] = useState<string[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState<BudgetClientFormValues>(() =>
    emptyBudgetClientForm(config.taxRate, market),
  );
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState<BudgetClientFormValues>(() =>
    emptyBudgetClientForm(config.taxRate, market),
  );
  const [signatureInvalidated, setSignatureInvalidated] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  const showFeedback = (message: string, severity: "success" | "error" | "info") => {
    setFeedback({ open: true, message, severity });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, mRes, sRes, cRes, productsRes] = await Promise.all([
        fetch(`${API}/proposals/${id}`, { credentials: "include" }),
        fetch(`${API}/proposals/${id}/materials`, { credentials: "include" }),
        fetch(`${API}/proposals/${id}/sections`, { credentials: "include" }),
        fetch(`${API}/proposals/${id}/comments`, { credentials: "include" }),
        fetch(adminApiUrl("/products", market), { credentials: "include" }),
      ]);

      let packagingMap = new Map<string, ProductPackagingLookup>();
      const productOptions: BudgetProductOption[] = [];
      if (productsRes.ok) {
        const rawProducts = (await productsRes.json()) as Record<string, unknown>[];
        for (const p of rawProducts) {
          const sku = String(p.sku ?? "");
          const packaging = parsePackaging({
            piecesPerBox: p.piecesPerBox as number | string | null | undefined,
            unitPerPiece: p.unitPerPiece as number | string | null | undefined,
          });
          const unit = normalizeUnit(typeof p.unit === "string" ? p.unit : "unidad");
          const pvpPrice = Number(p.pvpPrice) || 0;
          packagingMap.set(sku, { ...packaging, unit, pvpPrice });
          productOptions.push({
            sku,
            name: String(p.name ?? ""),
            pvpPrice,
            unit,
            piecesPerBox: packaging.piecesPerBox,
            unitPerPiece: packaging.unitPerPiece,
          });
        }
        setProducts(productOptions);
      }

      if (pRes.ok) {
        const p = (await pRes.json()) as Proposal;
        setProposal(p);
        setTitle(p.title ?? "");
        setLaborCost(Number(p.laborCost) || 0);
        setTaxRate(
          p.taxRate !== undefined && p.taxRate !== null
            ? Number(p.taxRate)
            : config.taxRate,
        );
        if (p.sections?.length) setSections(p.sections);
        if (p.client) {
          setSelectedClientId(p.client.id);
          setClientForm(clientToFormValues(p.client, config.taxRate, market));
        } else {
          setSelectedClientId(null);
          setClientForm(emptyBudgetClientForm(config.taxRate, market));
        }
      }
      if (mRes.ok) {
        const raw = (await mRes.json()) as Omit<
          Material,
          "piecesPerBox" | "unitPerPiece"
        >[];
        setMaterials(
          raw.map((m) => {
            const fromProduct = packagingMap.get(m.productSku);
            const stored = Number(m.suggestedPrice);
            const suggestedPrice =
              Number.isFinite(stored) && stored > 0
                ? stored
                : fromProduct?.pvpPrice && fromProduct.pvpPrice > 0
                  ? fromProduct.pvpPrice
                  : Number.isFinite(stored)
                    ? stored
                    : 0;
            return {
              ...m,
              unit: normalizeUnit(fromProduct?.unit ?? m.unit ?? "unidad"),
              discountPct: Number(m.discountPct) || 0,
              quantity: Number(m.quantity),
              orderedQuantity: Number(m.orderedQuantity) || 0,
              invoicedQuantity: Number(m.invoicedQuantity) || 0,
              supplierOrderedQuantity: Number(m.supplierOrderedQuantity) || 0,
              orderInvoicedQuantity: Number(m.orderInvoicedQuantity) || 0,
              suggestedPrice,
              piecesPerBox: fromProduct?.piecesPerBox ?? null,
              unitPerPiece: fromProduct?.unitPerPiece ?? null,
              externalComment: m.externalComment ?? "",
              internalComment: m.internalComment ?? "",
              lineStatus: (m.lineStatus as MaterialLineStatus) ?? "pending",
              canOrder: m.canOrder ?? true,
              canCreateSupplierOrder: m.canCreateSupplierOrder ?? true,
              canInvoice: m.canInvoice ?? true,
            };
          }),
        );
      }
      if (sRes.ok) setSections(await sRes.json());
      if (cRes.ok) setComments(await cRes.json());
    } finally {
      setLoading(false);
    }
  }, [id, config.taxRate, market]);

  useEffect(() => {
    if (user?.role === "admin" && id) void fetchData();
  }, [user, id, fetchData]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    void (async () => {
      const res = await fetch(adminApiUrl("/admin/users?role=client", market), {
        credentials: "include",
      });
      if (res.ok) setClients((await res.json()) as ClientInfo[]);
    })();
  }, [user, market]);

  const pendingMaterials = useMemo(
    () => materials.filter((m) => orderRemainingQty(m) > 0),
    [materials],
  );

  const invoiceableMaterials = useMemo(
    () => materials.filter((m) => invoiceRemainingQty(m) > 0),
    [materials],
  );

  const grouped = useMemo(() => {
    const bySection = new Map<string | null, Material[]>();
    for (const m of materials) {
      const key = m.sectionId;
      const list = bySection.get(key) ?? [];
      list.push(m);
      bySection.set(key, list);
    }
    const orderedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const groups: { id: string | null; name: string; materials: Material[] }[] = [];
    for (const s of orderedSections) {
      groups.push({
        id: s.id,
        name: s.name,
        materials: bySection.get(s.id) ?? [],
      });
      bySection.delete(s.id);
    }
    const unsectioned = bySection.get(null) ?? [];
    for (const [sectionId, mats] of bySection) {
      if (sectionId === null) continue;
      groups.push({ id: sectionId, name: "Sección", materials: mats });
    }
    if (unsectioned.length || groups.length === 0) {
      groups.push({
        id: null,
        name: groups.length ? "Sin sección" : "Líneas",
        materials: unsectioned.length ? unsectioned : materials,
      });
    }
    return groups.filter((g, idx, arr) => {
      if (g.materials.length > 0) return true;
      return arr.length === 1 && idx === 0;
    });
  }, [materials, sections]);

  const clientOptions = useMemo(() => {
    if (!proposal?.client) return clients;
    if (clients.some((c) => c.id === proposal.client!.id)) return clients;
    return [proposal.client, ...clients];
  }, [clients, proposal?.client]);

  const subtotal =
    materials.reduce(
      (s, m) =>
        s +
        lineNetTotal(
          Number(m.quantity),
          Number(m.suggestedPrice),
          Number(m.discountPct) || 0,
        ),
      0,
    ) + Number(laborCost);
  const taxAmount = subtotal * (Number(taxRate) / 100);
  const total = subtotal + taxAmount;

  async function persistBudget(options?: { silent?: boolean }): Promise<boolean> {
    const clientId = selectedClientId ?? proposal?.client?.id;
    const filledGroups = grouped
      .map((g) => ({
        ...g,
        materials: g.materials.filter(
          (m) => Boolean(m.productName.trim() || m.productSku.trim()) && m.quantity > 0,
        ),
      }))
      .filter((g) => g.materials.length > 0 || g.id !== null);

    const res = await fetch(`${API}/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: title || null,
        taxRate,
        laborCost,
        clientId: clientId || undefined,
        sections: filledGroups.map((g, i) => ({
          name: g.name,
          sortOrder: i,
          materials: g.materials.map((m) => ({
            productSku: m.productSku || undefined,
            productName: m.productName,
            quantity: m.quantity,
            suggestedPrice: Number(m.suggestedPrice),
            discountPct: Number(m.discountPct) || 0,
            unit: normalizeUnit(m.unit),
            externalComment: m.externalComment || null,
            internalComment: m.internalComment || null,
          })),
        })),
      }),
    });
    if (!res.ok) {
      throw new Error(await readApiError(res, "No se pudo guardar"));
    }
    if (!options?.silent) {
      showFeedback("Presupuesto guardado", "success");
    }
    return true;
  }

  async function handleSave() {
    const status = proposal?.status;
    if (
      status === "proforma_ready" ||
      status === "signed" ||
      status === "rejected"
    ) {
      showFeedback(
        "Primero pulsa «Editar e invalidar firma» para poder modificar el presupuesto.",
        "info",
      );
      return;
    }

    setActiveAction("save");
    try {
      await persistBudget();
      await fetchData();
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleUnlockForEdit() {
    const status = proposal?.status;
    if (
      status !== "proforma_ready" &&
      status !== "signed" &&
      status !== "rejected"
    ) {
      return;
    }
    const ok = await confirm({
      title: "Editar e invalidar firma",
      message:
        "Se invalidará la proforma o firma ahora. Luego puedes editar y guardar con normalidad. Después habrá que generar, enviar y firmar de nuevo.",
      confirmLabel: "Invalidar y editar",
      confirmColor: "warning",
    });
    if (!ok) return;

    setActiveAction("save");
    try {
      // Invalidate status only — keep current lines intact
      const res = await fetch(`${API}/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo invalidar la firma"));
      }
      setSignatureInvalidated(true);
      showFeedback(
        "Firma/proforma invalidada. Ya puedes editar y guardar. Luego genera y envía la proforma.",
        "info",
      );
      await fetchData();
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al invalidar", "error");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSaveClient() {
    const clientId = selectedClientId ?? proposal?.client?.id;
    if (!clientId) {
      showFeedback("No hay cliente asignado", "error");
      return;
    }
    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      showFeedback("Nombre y email son obligatorios", "error");
      return;
    }
    setActiveAction("client");
    try {
      const current =
        clients.find((c) => c.id === clientId) ?? proposal?.client ?? null;
      const needsPatch =
        !current ||
        clientFormHasChanges(clientForm, current, config.taxRate, market);

      if (needsPatch) {
        const res = await fetch(`${API}/admin/users/${clientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: clientForm.name.trim(),
            email: clientForm.email.trim(),
            taxRate: clientForm.taxExempt ? 0 : clientForm.taxRate,
            taxExempt: clientForm.taxExempt,
            profileData: buildClientProfileData(clientForm),
          }),
        });
        if (!res.ok) {
          throw new Error(await readApiError(res, "No se pudo actualizar el cliente"));
        }
        const updated = (await res.json()) as ClientInfo;
        setClients((prev) => {
          const exists = prev.some((c) => c.id === updated.id);
          return exists
            ? prev.map((c) => (c.id === updated.id ? updated : c))
            : [updated, ...prev];
        });
      }

      if (proposal?.client?.id !== clientId) {
        const linkRes = await fetch(`${API}/proposals/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ clientId }),
        });
        if (!linkRes.ok) {
          throw new Error(await readApiError(linkRes, "No se pudo asignar el cliente"));
        }
      }

      await fetchData();
      showFeedback("Cliente guardado", "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al guardar cliente", "error");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCreateClient() {
    if (!newClientForm.name.trim() || !newClientForm.email.trim()) {
      showFeedback("Nombre y email son obligatorios", "error");
      return;
    }
    if (newClientForm.password.length < 8) {
      showFeedback("La contraseña debe tener al menos 8 caracteres", "error");
      return;
    }
    setActiveAction("createClient");
    try {
      const res = await fetch(`${API}/admin/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newClientForm.name,
          email: newClientForm.email,
          password: newClientForm.password,
          country: market,
          taxRate: newClientForm.taxExempt ? 0 : newClientForm.taxRate,
          taxExempt: newClientForm.taxExempt,
          profileData: buildClientProfileData(newClientForm),
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "No se pudo crear el cliente"));
      const created = (await res.json()) as ClientInfo;
      setClients((prev) => [created, ...prev]);
      setSelectedClientId(created.id);
      setClientForm(clientToFormValues(created, config.taxRate, market));
      setClientDialogOpen(false);
      setNewClientForm(emptyBudgetClientForm(config.taxRate, market));

      const linkRes = await fetch(`${API}/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clientId: created.id }),
      });
      if (!linkRes.ok) {
        throw new Error(await readApiError(linkRes, "Cliente creado pero no asignado"));
      }
      await fetchData();
      showFeedback("Cliente creado y asignado", "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al crear cliente", "error");
    } finally {
      setActiveAction(null);
    }
  }

  function selectClient(client: ClientInfo | null) {
    if (!client) return;
    setSelectedClientId(client.id);
    setClientForm(clientToFormValues(client, config.taxRate, market));
  }

  async function handleReady() {
    if (total <= 0) {
      showFeedback(
        "Total en 0. Revisa precios de línea (o guarda PVP del catálogo) antes de generar la proforma.",
        "error",
      );
      return;
    }
    setActiveAction("ready");
    try {
      await persistBudget({ silent: true });
      const res = await fetch(`${API}/proposals/${id}/ready`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo generar la proforma"));
      }
      await fetchData();
      setSignatureInvalidated(false);
      showFeedback("Proforma generada. Ya puedes enviarla al cliente o descargar el PDF.", "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al generar proforma", "error");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSendEmail() {
    setActiveAction("email");
    try {
      await persistBudget({ silent: true });
      const res = await fetch(`${API}/proposals/${id}/send-proforma`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo enviar el email"));
      }
      showFeedback(`Proforma enviada por email a ${proposal?.client?.email ?? "el cliente"}`, "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al enviar email", "error");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleDownloadPdf() {
    setActiveAction("pdf");
    try {
      await persistBudget({ silent: true });
      const res = await fetch(`${API}/proposals/${id}/proforma.pdf`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo descargar el PDF"));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      showFeedback("PDF generado correctamente", "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al descargar PDF", "error");
    } finally {
      setActiveAction(null);
    }
  }

  function openTransferDialog(target: TransferTarget, materialIds: string[]) {
    setTransferTarget(target);
    setTransferMaterialIds(materialIds);
    setTransferOpen(true);
  }

  function openOrderDialog() {
    openTransferDialog(
      "order",
      pendingMaterials.map((m) => m.id),
    );
  }

  async function handleTransferConfirm(payload: {
    materialListIds: string[];
    externalNotes?: string;
    internalNotes?: string;
    issueDate?: string;
    dueDate?: string;
    includeLabor?: boolean;
  }) {
    setActiveAction("transfer");
    try {
      if (transferTarget === "invoice") {
        const res = await fetch(`${API}/invoices/from-proposal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            proposalId: id,
            taxRate,
            materialListIds: payload.materialListIds,
            issueDate: payload.issueDate,
            dueDate: payload.dueDate,
            includeLabor: payload.includeLabor ?? false,
            notes: payload.internalNotes,
          }),
        });
        if (!res.ok) {
          throw new Error(await readApiError(res, "No se pudo crear la factura"));
        }
        const invoice = (await res.json()) as { invoiceNumber?: string };
        setTransferOpen(false);
        setSelectedMaterialIds([]);
        await fetchData();
        showFeedback(
          `Factura ${invoice.invoiceNumber ?? ""} creada correctamente`,
          "success",
        );
        return;
      }

      const res = await fetch(`${API}/orders/from-proposal/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taxRate,
          materialListIds: payload.materialListIds,
          externalNotes: payload.externalNotes,
          internalNotes: payload.internalNotes,
          alsoCreateSupplierOrders: transferTarget === "supplier_order",
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo crear el pedido"));
      }
      const order = (await res.json()) as {
        orderNumber?: string;
        id?: string;
        supplierOrders?: {
          created: Array<{ orderNumber: string }>;
          skipped: Array<{ sku: string }>;
        };
      };
      setTransferOpen(false);
      setSelectedMaterialIds([]);
      await fetchData();
      const createdPos = order.supplierOrders?.created?.length ?? 0;
      const skipped = order.supplierOrders?.skipped?.length ?? 0;
      let msg = `Pedido ${order.orderNumber ?? ""} creado correctamente`;
      if (transferTarget === "supplier_order") {
        msg += createdPos
          ? ` · ${createdPos} pedido(s) a proveedor`
          : " · sin pedidos a proveedor generados";
        if (skipped > 0) msg += ` (${skipped} SKU sin proveedor)`;
      }
      showFeedback(msg, "success");
    } catch (err: unknown) {
      showFeedback(
        err instanceof Error ? err.message : "Error en el traspaso",
        "error",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setActiveAction("comment");
    try {
      const res = await fetch(`${API}/proposals/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: newComment,
          visibility: commentTab,
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo agregar el comentario"));
      }
      setNewComment("");
      const cRes = await fetch(`${API}/proposals/${id}/comments`, { credentials: "include" });
      if (cRes.ok) setComments(await cRes.json());
      showFeedback("Comentario agregado", "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al comentar", "error");
    } finally {
      setActiveAction(null);
    }
  }

  function updateMaterial(materialId: string, patch: Partial<Material>) {
    setMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, ...patch } : m)),
    );
  }

  function addMaterialToSection(sectionId: string | null) {
    setMaterials((prev) => [...prev, emptyMaterial(sectionId)]);
  }

  function removeMaterial(materialId: string) {
    setMaterials((prev) => {
      const next = prev.filter((m) => m.id !== materialId);
      return next.length > 0 ? next : prev;
    });
  }

  function addSection() {
    const section: Section = {
      id: newLocalId("section"),
      name: `Sección ${sections.length + 1}`,
      sortOrder: sections.length,
    };
    setSections((prev) => [...prev, section]);
    setMaterials((prev) => [...prev, emptyMaterial(section.id)]);
  }

  function removeSection(sectionId: string) {
    if (sections.length <= 1 && materials.every((m) => m.sectionId === sectionId)) {
      return;
    }
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    setMaterials((prev) => prev.filter((m) => m.sectionId !== sectionId));
  }

  function renameSection(sectionId: string, name: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, name } : s)),
    );
  }

  if (loading || !proposal) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const workflowStep = getWorkflowStep(proposal.status);
  const generateEnabled = canGenerateProforma(proposal.status);
  const emailEnabled = proposal.status === "proforma_ready";
  const isDirectSale = proposal.type === "direct_sale";
  const linesLocked =
    proposal.status === "proforma_ready" ||
    proposal.status === "signed" ||
    proposal.status === "rejected";
  const orderEnabled =
    pendingMaterials.length > 0 &&
    (isDirectSale
      ? ["pending", "proforma_ready", "signed", "solicitud_submitted"].includes(
          proposal.status,
        )
      : proposal.status === "signed");
  const invoiceTransferEnabled = proposal.status === "signed";
  const transferEnabled = orderEnabled || invoiceTransferEnabled;
  const hasPartialOrders = materials.some((m) => Number(m.orderedQuantity) > 0);

  const selectedMaterials = materials.filter((m) =>
    selectedMaterialIds.includes(m.id),
  );
  const selectedCanOrder = selectedMaterials.filter((m) => m.canOrder);
  const selectedCanSupplier = selectedMaterials.filter(
    (m) => m.canCreateSupplierOrder,
  );
  const selectedCanInvoice = selectedMaterials.filter((m) => m.canInvoice);

  const transferLines = materials
    .filter((m) => transferMaterialIds.includes(m.id))
    .map((m) => ({
      id: m.id,
      productSku: m.productSku,
      productName: m.productName,
      unit: m.unit,
      quantity: m.quantity,
      remaining:
        transferTarget === "invoice"
          ? invoiceRemainingQty(m)
          : orderRemainingQty(m),
    }))
    .filter((m) => m.remaining > 0);

  const visibleComments = comments.filter((c) => c.visibility === commentTab);
  const selectedClientOption =
    clientOptions.find((c) => c.id === selectedClientId) ?? null;

  return (
    <>
      <ConfirmDialogHost />
      <Stack spacing={2}>
        <PageToolbar>
          <Button component={Link} href="/admin/presupuestos" size="small">
            ← Volver
          </Button>
          <Box sx={{ flex: 1, minWidth: { sm: "auto" } }}>
            <Typography variant="h5">{title || "Presupuesto / Solicitud"}</Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 0.5 }}
            >
              <Chip
                label={getProposalTypeLabel(proposal.type)}
                size="small"
                variant="outlined"
              />
              <Chip
                label={getProposalStatusLabel(proposal.status)}
                size="small"
                color={getProposalStatusColor(proposal.status)}
              />
            </Stack>
          </Box>
          <Button
            variant="outlined"
            startIcon={activeAction === "save" ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={activeAction !== null || linesLocked}
          >
            Guardar
          </Button>
          {linesLocked && (
            <Button
              variant="contained"
              color="warning"
              startIcon={
                activeAction === "save" ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <EditIcon />
                )
              }
              onClick={handleUnlockForEdit}
              disabled={activeAction !== null}
            >
              Editar e invalidar firma
            </Button>
          )}
        </PageToolbar>

        {linesLocked && (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<EditIcon />}
                onClick={handleUnlockForEdit}
                disabled={activeAction !== null}
              >
                Editar
              </Button>
            }
          >
            Presupuesto con proforma o firma. Líneas bloqueadas. Pulsa «Editar e invalidar
            firma» una vez; luego edita y guarda con normalidad.
          </Alert>
        )}

        {(signatureInvalidated ||
          (!linesLocked &&
            generateEnabled &&
            ["pending", "solicitud_submitted"].includes(proposal.status))) && (
          <Alert
            severity="warning"
            onClose={
              signatureInvalidated ? () => setSignatureInvalidated(false) : undefined
            }
          >
            {signatureInvalidated
              ? "Proforma o firma invalidada. Edita lo que necesites, guarda, genera la proforma y envíala para firmar de nuevo."
              : "Pendiente de generar / enviar proforma para firma del cliente."}
          </Alert>
        )}

        {hasPartialOrders && (
          <Alert severity="info">
            Hay cantidades ya convertidas a pedido. Puedes seguir editando el presupuesto;
            los pedidos existentes no se borran.
          </Alert>
        )}

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Datos del cliente
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
            <Autocomplete
              sx={{ flex: 1 }}
              options={clientOptions}
              value={selectedClientOption}
              onChange={(_, value) => selectClient(value)}
              getOptionLabel={(c) => `${c.name} (${c.email})`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField {...params} label="Buscar / cambiar cliente" size="small" />
              )}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setNewClientForm(emptyBudgetClientForm(config.taxRate, market));
                setClientDialogOpen(true);
              }}
              disabled={activeAction !== null}
            >
              Nuevo cliente
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveClient}
              disabled={activeAction !== null || !selectedClientId}
              startIcon={
                activeAction === "client" ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
            >
              Guardar cliente
            </Button>
          </Stack>
          <BudgetClientForm
            value={clientForm}
            onChange={(patch) => setClientForm((prev) => ({ ...prev, ...patch }))}
            market={market}
            taxLabel={config.taxLabel}
            disabled={activeAction !== null}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Título"
              size="small"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <ClearableNumberField
              label={`${config.taxLabel} %`}
              size="small"
              value={taxRate}
              onValueChange={setTaxRate}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ width: { sm: 140 } }}
            />
            <ClearableNumberField
              label="Mano de obra"
              size="small"
              value={laborCost}
              onValueChange={setLaborCost}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ width: { sm: 160 } }}
            />
          </Stack>
        </Paper>

        {proposal.status === "proforma_ready" && (
          <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
            Proforma lista. Envíala por email o descarga el PDF. Para cambiar líneas usa
            «Editar e invalidar firma».
          </Alert>
        )}

        {proposal.status === "signed" && (
          <Alert severity="info">
            El cliente firmó. Puedes crear el pedido (total o parcial). Para cambiar el
            presupuesto usa «Editar e invalidar firma».
          </Alert>
        )}

        {proposal.message && (
          <Alert severity="info" variant="outlined">
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Mensaje del cliente
            </Typography>
            {proposal.message}
          </Alert>
        )}

        {!isDirectSale && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stepper activeStep={workflowStep} alternativeLabel sx={{ mb: 1 }}>
              <Step completed={workflowStep > 0}>
                <StepLabel>Revisar solicitud</StepLabel>
              </Step>
              <Step completed={workflowStep > 1}>
                <StepLabel>Generar proforma</StepLabel>
              </Step>
              <Step completed={workflowStep > 2}>
                <StepLabel>Enviar al cliente</StepLabel>
              </Step>
              <Step completed={workflowStep > 3}>
                <StepLabel>Crear pedido</StepLabel>
              </Step>
            </Stepper>
          </Paper>
        )}

        {transferEnabled && selectedMaterialIds.length > 0 && (
          <Paper sx={{ p: 1.5 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              <Typography variant="body2" sx={{ mr: 1 }}>
                {selectedMaterialIds.length} seleccionado(s)
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ShoppingCartIcon />}
                disabled={!orderEnabled || selectedCanOrder.length === 0 || activeAction !== null}
                onClick={() =>
                  openTransferDialog(
                    "order",
                    selectedCanOrder.map((m) => m.id),
                  )
                }
              >
                A Pedido
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<LocalShippingIcon />}
                disabled={
                  !orderEnabled ||
                  selectedCanSupplier.length === 0 ||
                  activeAction !== null
                }
                onClick={() =>
                  openTransferDialog(
                    "supplier_order",
                    selectedCanSupplier.map((m) => m.id),
                  )
                }
              >
                A Pedido a Proveedor
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ReceiptIcon />}
                disabled={
                  !invoiceTransferEnabled ||
                  selectedCanInvoice.length === 0 ||
                  activeAction !== null
                }
                onClick={() =>
                  openTransferDialog(
                    "invoice",
                    selectedCanInvoice.map((m) => m.id),
                  )
                }
              >
                A Factura
              </Button>
              <Button
                size="small"
                onClick={() => setSelectedMaterialIds([])}
                disabled={activeAction !== null}
              >
                Limpiar
              </Button>
            </Stack>
          </Paper>
        )}

        {grouped.map((group) => (
          <Paper key={group.id ?? "none"} sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              {group.id ? (
                <TextField
                  label="Sección"
                  size="small"
                  value={group.name}
                  disabled={linesLocked}
                  onChange={(e) => renameSection(group.id!, e.target.value)}
                  sx={{ flex: 1 }}
                />
              ) : (
                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  {group.name}
                </Typography>
              )}
              {group.id && (
                <IconButton
                  aria-label="Eliminar sección"
                  disabled={linesLocked || sections.length <= 1}
                  onClick={() => removeSection(group.id!)}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Stack>
            <ResponsiveTable minWidth={1100} size="small" elevation={0}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" width={48}>
                    {transferEnabled && (
                      <Checkbox
                        size="small"
                        checked={
                          group.materials.length > 0 &&
                          group.materials.every((m) =>
                            selectedMaterialIds.includes(m.id),
                          )
                        }
                        indeterminate={
                          group.materials.some((m) =>
                            selectedMaterialIds.includes(m.id),
                          ) &&
                          !group.materials.every((m) =>
                            selectedMaterialIds.includes(m.id),
                          )
                        }
                        onChange={(e) => {
                          const ids = group.materials.map((m) => m.id);
                          setSelectedMaterialIds((prev) =>
                            e.target.checked
                              ? [...new Set([...prev, ...ids])]
                              : prev.filter((id) => !ids.includes(id)),
                          );
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Cant. / m²</TableCell>
                  <TableCell>Ud</TableCell>
                  <TableCell>Pedido</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Dto %</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="right" width={120} />
                </TableRow>
              </TableHead>
              <TableBody>
                {group.materials.map((m) => (
                  <BudgetLineRow
                    key={m.id}
                    currency={config.currency}
                    commentsColSpan={DETAIL_COMMENTS_COLSPAN}
                    disabled={linesLocked}
                    canDelete={materials.length > 1}
                    onDelete={() => removeMaterial(m.id)}
                    line={{
                      unit: m.unit,
                      quantity: m.quantity,
                      suggestedPrice: m.suggestedPrice,
                      discountPct: m.discountPct ?? 0,
                      piecesPerBox: m.piecesPerBox,
                      unitPerPiece: m.unitPerPiece,
                      externalComment: m.externalComment ?? "",
                      internalComment: m.internalComment ?? "",
                    }}
                    onChange={(patch) => updateMaterial(m.id, patch)}
                    leadingCells={
                      <>
                        <TableCell padding="checkbox" sx={{ verticalAlign: "top" }}>
                          {transferEnabled && (
                            <Checkbox
                              size="small"
                              checked={selectedMaterialIds.includes(m.id)}
                              onChange={(e) => {
                                setSelectedMaterialIds((prev) =>
                                  e.target.checked
                                    ? [...prev, m.id]
                                    : prev.filter((x) => x !== m.id),
                                );
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 260, verticalAlign: "top" }}>
                          <BudgetProductCell
                            products={products}
                            productSku={m.productSku}
                            productName={m.productName}
                            unit={m.unit}
                            showSkuHint
                            disabled={linesLocked}
                            onChange={(patch) => updateMaterial(m.id, patch)}
                          />
                        </TableCell>
                      </>
                    }
                    afterUnitCell={
                      <TableCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                        {m.orderedQuantity ?? 0}/{m.quantity}
                      </TableCell>
                    }
                    statusCell={
                      <TableCell sx={{ verticalAlign: "top" }}>
                        <Chip
                          size="small"
                          label={getMaterialLineStatusLabel(m.lineStatus)}
                          color={getMaterialLineStatusColor(m.lineStatus)}
                          variant="outlined"
                        />
                      </TableCell>
                    }
                    extraActions={
                      <BudgetLineTransferMenu
                        transferEnabled={transferEnabled}
                        canOrder={orderEnabled && m.canOrder}
                        canCreateSupplierOrder={
                          orderEnabled && m.canCreateSupplierOrder
                        }
                        canInvoice={invoiceTransferEnabled && m.canInvoice}
                        disabled={activeAction !== null}
                        onAction={(target) => openTransferDialog(target, [m.id])}
                      />
                    }
                  />
                ))}
                {group.materials.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={DETAIL_COMMENTS_COLSPAN} align="center">
                      Sin líneas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </ResponsiveTable>
            <Button
              size="small"
              startIcon={<AddIcon />}
              sx={{ mt: 1.5 }}
              disabled={linesLocked}
              onClick={() => addMaterialToSection(group.id)}
            >
              Agregar línea
            </Button>
          </Paper>
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          disabled={linesLocked}
          onClick={addSection}
        >
          Agregar sección
        </Button>

        <Paper sx={{ p: 2 }}>
          <Stack spacing={0.5} alignItems="flex-end">
            <Typography>Subtotal: {formatCurrency(subtotal, config.currency)}</Typography>
            <Typography>
              {config.taxLabel} ({taxRate}%): {formatCurrency(taxAmount, config.currency)}
            </Typography>
            <Typography fontWeight="bold">
              Total: {formatCurrency(total, config.currency)}
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <ScrollableTabs
            value={commentTab}
            onChange={(_, v: "client" | "internal") => setCommentTab(v)}
            sx={{ mb: 2 }}
          >
            <Tab value="client" label="Comentarios al cliente" />
            <Tab value="internal" label="Comentarios internos" />
          </ScrollableTabs>
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {visibleComments.map((c) => (
              <Box key={c.id} sx={{ borderLeft: 3, borderColor: "divider", pl: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {c.author?.name ?? "Usuario"} ·{" "}
                  {new Date(c.createdAt).toLocaleString("es-ES")}
                </Typography>
                <Typography variant="body2">{c.content}</Typography>
              </Box>
            ))}
            {visibleComments.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Sin comentarios
              </Typography>
            )}
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              placeholder={
                commentTab === "client"
                  ? "Escribe un comentario visible para el cliente…"
                  : "Nota interna (solo admin)…"
              }
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button
              variant="contained"
              startIcon={
                activeAction === "comment" ? <CircularProgress size={16} color="inherit" /> : <AddIcon />
              }
              onClick={handleAddComment}
              disabled={!newComment.trim() || activeAction !== null}
              sx={{ alignSelf: { sm: "flex-start" } }}
            >
              Comentar
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Acciones
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {linesLocked ? (
              <Button
                variant="contained"
                color="warning"
                startIcon={
                  activeAction === "save" ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <EditIcon />
                  )
                }
                onClick={handleUnlockForEdit}
                disabled={activeAction !== null}
              >
                Editar e invalidar firma
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={
                  activeAction === "save" ? <CircularProgress size={16} /> : <SaveIcon />
                }
                onClick={handleSave}
                disabled={activeAction !== null}
              >
                Guardar
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={
                activeAction === "ready" ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SendIcon />
                )
              }
              onClick={handleReady}
              disabled={!generateEnabled || activeAction !== null}
            >
              {generateEnabled ? "Generar proforma" : "Proforma ya generada"}
            </Button>
            <Button
              variant="outlined"
              startIcon={activeAction === "email" ? <CircularProgress size={16} /> : <EmailIcon />}
              onClick={handleSendEmail}
              disabled={!emailEnabled || activeAction !== null}
            >
              Enviar email
            </Button>
            <Button
              variant="outlined"
              startIcon={
                activeAction === "pdf" ? <CircularProgress size={16} /> : <PictureAsPdfIcon />
              }
              onClick={handleDownloadPdf}
              disabled={activeAction !== null}
            >
              Descargar PDF
            </Button>
            {orderEnabled && (
              <Button
                variant="contained"
                color="success"
                onClick={openOrderDialog}
                disabled={activeAction !== null}
                startIcon={<ShoppingCartIcon />}
              >
                Crear pedido
              </Button>
            )}
            {invoiceTransferEnabled && invoiceableMaterials.length > 0 && (
              <Button
                variant="contained"
                onClick={() =>
                  openTransferDialog(
                    "invoice",
                    invoiceableMaterials.map((m) => m.id),
                  )
                }
                disabled={activeAction !== null}
                startIcon={<ReceiptIcon />}
              >
                Crear factura
              </Button>
            )}
          </Stack>
        </Paper>
      </Stack>

      <Dialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nuevo cliente</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <BudgetClientForm
              value={newClientForm}
              onChange={(patch) => setNewClientForm((prev) => ({ ...prev, ...patch }))}
              market={market}
              taxLabel={config.taxLabel}
              showPassword
              disabled={activeAction === "createClient"}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setClientDialogOpen(false)}
            disabled={activeAction === "createClient"}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateClient}
            disabled={
              activeAction === "createClient" ||
              !newClientForm.name.trim() ||
              !newClientForm.email.trim()
            }
            startIcon={
              activeAction === "createClient" ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
          >
            Crear y asignar
          </Button>
        </DialogActions>
      </Dialog>

      <BudgetLineTransferDialog
        open={transferOpen}
        target={transferTarget}
        lines={transferLines}
        submitting={activeAction === "transfer"}
        taxRate={taxRate}
        taxLabel={config.taxLabel}
        laborCost={Number(laborCost) || 0}
        onClose={() => setTransferOpen(false)}
        onConfirm={handleTransferConfirm}
      />

      <Snackbar
        open={feedback.open}
        autoHideDuration={5000}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setFeedback((f) => ({ ...f, open: false }))}
          severity={feedback.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
