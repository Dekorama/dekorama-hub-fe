"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
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
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
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
import {
  displayUnitLabel,
  lineNetTotal,
  normalizeUnit,
  parsePackaging,
} from "@/features/admin/utils/lineItemMath";
import { BudgetLineRow } from "@/features/admin/components/BudgetLineRow";
import { adminApiUrl } from "@/features/admin/utils/adminApi";

interface Material {
  id: string;
  productSku: string;
  productName: string;
  unit: string;
  quantity: number;
  orderedQuantity: number;
  suggestedPrice: number;
  discountPct: number;
  sectionId: string | null;
  externalComment?: string | null;
  internalComment?: string | null;
  piecesPerBox: number | null;
  unitPerPiece: number | null;
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

type ActionKey = "save" | "ready" | "email" | "pdf" | "order" | "comment";

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
};

/** Detail table: SKU | Producto | qty | Ud | Pedido | Precio | Dto | Subtotal | actions = 9 */
const DETAIL_COMMENTS_COLSPAN = 9;

export function AdminBudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const { config, market } = useAdminMarket();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTab, setCommentTab] = useState<"client" | "internal">("client");
  const [newComment, setNewComment] = useState("");
  const [title, setTitle] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [laborCost, setLaborCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<ActionKey | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [orderExternalNotes, setOrderExternalNotes] = useState("");
  const [orderInternalNotes, setOrderInternalNotes] = useState("");
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
      if (productsRes.ok) {
        const products = (await productsRes.json()) as Record<string, unknown>[];
        packagingMap = new Map(
          products.map((p) => {
            const sku = String(p.sku ?? "");
            const packaging = parsePackaging({
              piecesPerBox: p.piecesPerBox as number | string | null | undefined,
              unitPerPiece: p.unitPerPiece as number | string | null | undefined,
            });
            return [
              sku,
              {
                ...packaging,
                unit: normalizeUnit(typeof p.unit === "string" ? p.unit : "unidad"),
              },
            ] as const;
          }),
        );
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
      }
      if (mRes.ok) {
        const raw = (await mRes.json()) as Omit<
          Material,
          "piecesPerBox" | "unitPerPiece"
        >[];
        setMaterials(
          raw.map((m) => {
            const fromProduct = packagingMap.get(m.productSku);
            return {
              ...m,
              unit: normalizeUnit(fromProduct?.unit ?? m.unit ?? "unidad"),
              discountPct: Number(m.discountPct) || 0,
              quantity: Number(m.quantity),
              orderedQuantity: Number(m.orderedQuantity) || 0,
              suggestedPrice: Number(m.suggestedPrice),
              piecesPerBox: fromProduct?.piecesPerBox ?? null,
              unitPerPiece: fromProduct?.unitPerPiece ?? null,
              externalComment: m.externalComment ?? "",
              internalComment: m.internalComment ?? "",
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

  const pendingMaterials = useMemo(
    () =>
      materials.filter(
        (m) => Number(m.orderedQuantity ?? 0) < Number(m.quantity),
      ),
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

  async function handleSave() {
    setActiveAction("save");
    try {
      const res = await fetch(`${API}/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title || null,
          taxRate,
          laborCost,
          sections: grouped
            .filter((g) => g.id !== null || g.materials.length > 0)
            .map((g, i) => ({
              name: g.name,
              sortOrder: i,
              materials: g.materials.map((m) => ({
                productSku: m.productSku,
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
      await fetchData();
      showFeedback("Presupuesto guardado", "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setActiveAction(null);
    }
  }

  async function handleReady() {
    setActiveAction("ready");
    try {
      const res = await fetch(`${API}/proposals/${id}/ready`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo generar la proforma"));
      }
      await fetchData();
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

  function openOrderDialog() {
    setSelectedMaterialIds(pendingMaterials.map((m) => m.id));
    setOrderExternalNotes("");
    setOrderInternalNotes("");
    setOrderDialogOpen(true);
  }

  async function handleCreateOrder() {
    setActiveAction("order");
    try {
      const res = await fetch(`${API}/orders/from-proposal/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taxRate,
          materialListIds: selectedMaterialIds,
          externalNotes: orderExternalNotes || undefined,
          internalNotes: orderInternalNotes || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo crear el pedido"));
      }
      const order = (await res.json()) as { orderNumber?: string; id?: string };
      setOrderDialogOpen(false);
      await fetchData();
      showFeedback(`Pedido ${order.orderNumber ?? ""} creado correctamente`, "success");
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : "Error al crear pedido", "error");
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
  const orderEnabled =
    pendingMaterials.length > 0 &&
    (isDirectSale
      ? ["pending", "proforma_ready", "signed"].includes(proposal.status)
      : proposal.status === "signed");

  const visibleComments = comments.filter((c) => c.visibility === commentTab);
  const phone =
    proposal.client?.profileData &&
    typeof proposal.client.profileData.phone === "string"
      ? proposal.client.profileData.phone
      : null;

  return (
    <>
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
            disabled={activeAction !== null}
          >
            Guardar
          </Button>
        </PageToolbar>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Datos del cliente
          </Typography>
          <Typography>
            {proposal.client?.name ?? "Cliente"} · {proposal.client?.email}
          </Typography>
          {phone && (
            <Typography variant="body2" color="text.secondary">
              Tel: {phone}
            </Typography>
          )}
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
            La proforma está lista. Envíala al cliente por email o comparte el PDF para que la revise y firme.
          </Alert>
        )}

        {proposal.status === "signed" && (
          <Alert severity="info">
            El cliente firmó la proforma. Puedes crear el pedido (total o parcial).
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

        {grouped.map((group) => (
          <Paper key={group.id ?? "none"} sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {group.name}
            </Typography>
            <ResponsiveTable minWidth={920} size="small" elevation={0}>
              <TableHead>
                <TableRow>
                  <TableCell>SKU</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Cant. / m²</TableCell>
                  <TableCell>Ud</TableCell>
                  <TableCell>Pedido</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Dto %</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="right" width={56} />
                </TableRow>
              </TableHead>
              <TableBody>
                {group.materials.map((m) => (
                  <BudgetLineRow
                    key={m.id}
                    commentsColSpan={DETAIL_COMMENTS_COLSPAN}
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
                        <TableCell sx={{ verticalAlign: "top" }}>{m.productSku}</TableCell>
                        <TableCell sx={{ verticalAlign: "top" }}>{m.productName}</TableCell>
                      </>
                    }
                    afterUnitCell={
                      <TableCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                        {m.orderedQuantity ?? 0}/{m.quantity}
                      </TableCell>
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
          </Paper>
        ))}

        <Paper sx={{ p: 2 }}>
          <Stack spacing={0.5} alignItems="flex-end">
            <Typography>Subtotal: ${subtotal.toFixed(2)}</Typography>
            <Typography>
              {config.taxLabel} ({taxRate}%): ${taxAmount.toFixed(2)}
            </Typography>
            <Typography fontWeight="bold">Total: ${total.toFixed(2)}</Typography>
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
            <Button
              variant="outlined"
              startIcon={activeAction === "save" ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={activeAction !== null}
            >
              Guardar
            </Button>
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
          </Stack>
        </Paper>
      </Stack>

      <Dialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Crear pedido desde presupuesto</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona las líneas a incluir. Puedes convertir el total o solo una parte.
          </Typography>
          <Stack spacing={0.5}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    pendingMaterials.length > 0 &&
                    selectedMaterialIds.length === pendingMaterials.length
                  }
                  indeterminate={
                    selectedMaterialIds.length > 0 &&
                    selectedMaterialIds.length < pendingMaterials.length
                  }
                  onChange={(e) => {
                    setSelectedMaterialIds(
                      e.target.checked ? pendingMaterials.map((m) => m.id) : [],
                    );
                  }}
                />
              }
              label="Seleccionar todo lo pendiente"
            />
            <Divider />
            {pendingMaterials.map((m) => {
              const remaining =
                Number(m.quantity) - Number(m.orderedQuantity ?? 0);
              return (
                <FormControlLabel
                  key={m.id}
                  control={
                    <Checkbox
                      checked={selectedMaterialIds.includes(m.id)}
                      onChange={(e) => {
                        setSelectedMaterialIds((prev) =>
                          e.target.checked
                            ? [...prev, m.id]
                            : prev.filter((x) => x !== m.id),
                        );
                      }}
                    />
                  }
                  label={`${m.productSku} — ${m.productName} (×${remaining} ${displayUnitLabel(m.unit)})`}
                />
              );
            })}
          </Stack>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Comentario externo (cliente)"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={orderExternalNotes}
              onChange={(e) => setOrderExternalNotes(e.target.value)}
            />
            <TextField
              label="Comentario interno"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={orderInternalNotes}
              onChange={(e) => setOrderInternalNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)} disabled={activeAction === "order"}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleCreateOrder}
            disabled={selectedMaterialIds.length === 0 || activeAction === "order"}
            startIcon={
              activeAction === "order" ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <ShoppingCartIcon />
              )
            }
          >
            Crear pedido
          </Button>
        </DialogActions>
      </Dialog>

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
