"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GavelIcon from "@mui/icons-material/Gavel";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useState } from "react";
import { API, CurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  CatalogProduct,
  DEPARTMENT_LABELS,
  Material,
  Project,
  Proposal,
  getProductPrice,
} from "@/features/projects/types";

interface ProposalDeptForm {
  projectDepartmentId: string;
  partialLaborCost: string;
  estimatedDays: string;
}

interface ProjectProposalsTabProps {
  project: Project;
  user: CurrentUser | null;
  proposals: Proposal[];
  isOwner: boolean;
  onRefresh: () => void;
}

const STATUS_CHIP: Record<string, { label: string; color: "default" | "warning" | "success" | "error" }> = {
  pending: { label: "Pendiente", color: "default" },
  proforma_ready: { label: "Proforma lista", color: "warning" },
  signed: { label: "Firmada", color: "success" },
  rejected: { label: "Rechazada", color: "error" },
};

export function ProjectProposalsTab({
  project,
  user,
  proposals,
  isOwner,
  onRefresh,
}: ProjectProposalsTabProps) {
  const isProfessional = user?.role === "professional" && user.isVerified;
  const myProposal = proposals.find((p) => p.professionalId === user?.id);

  const [openProposal, setOpenProposal] = useState(false);
  const [deptForms, setDeptForms] = useState<ProposalDeptForm[]>([]);
  const [message, setMessage] = useState("");
  const [proposalMaterials, setProposalMaterials] = useState<{ dekoramaSku: string; quantity: number; name: string }[]>([]);
  const [savingProposal, setSavingProposal] = useState(false);

  const [openMaterials, setOpenMaterials] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [selectedProposalStatus, setSelectedProposalStatus] = useState("pending");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [matQty, setMatQty] = useState("1");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  const [openProforma, setOpenProforma] = useState(false);
  const [proformaProposal, setProformaProposal] = useState<Proposal | null>(null);
  const [proformaMaterials, setProformaMaterials] = useState<Material[]>([]);
  const [signing, setSigning] = useState(false);

  const openCreateDialog = () => {
    setDeptForms(
      project.departments.map((d) => ({
        projectDepartmentId: d.id,
        partialLaborCost: "",
        estimatedDays: "",
      })),
    );
    setProposalMaterials([]);
    setMessage("");
    setOpenProposal(true);
  };

  const createProposal = async () => {
    setSavingProposal(true);
    try {
      await fetch(`${API}/projects/${project.id}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          departments: deptForms.map((d) => ({
            projectDepartmentId: d.projectDepartmentId,
            partialLaborCost: +d.partialLaborCost,
            estimatedDays: d.estimatedDays ? +d.estimatedDays : undefined,
          })),
          materials: proposalMaterials.map((m) => ({
            dekoramaSku: m.dekoramaSku,
            quantity: m.quantity,
          })),
          message: message || undefined,
        }),
      });
      setOpenProposal(false);
      onRefresh();
    } finally {
      setSavingProposal(false);
    }
  };

  const fetchMaterials = async (proposal: Proposal) => {
    const res = await fetch(`${API}/proposals/${proposal.id}/materials`, { credentials: "include" });
    if (res.ok) setMaterials(await res.json());
    setSelectedProposalId(proposal.id);
    setSelectedProposalStatus(proposal.status);
    const pRes = await fetch(`${API}/products`, { credentials: "include" });
    if (pRes.ok) setProducts(await pRes.json());
    setOpenMaterials(true);
  };

  const searchProducts = async () => {
    const res = await fetch(`${API}/products?search=${encodeURIComponent(productSearch)}`, { credentials: "include" });
    if (res.ok) setProducts(await res.json());
  };

  const addMaterialToProposal = async () => {
    if (!selectedProduct || !selectedProposalId) return;
    await fetch(`${API}/proposals/${selectedProposalId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        productSku: selectedProduct.sku,
        productName: selectedProduct.name,
        quantity: +matQty,
        suggestedPrice: getProductPrice(selectedProduct),
      }),
    });
    const res = await fetch(`${API}/proposals/${selectedProposalId}/materials`, { credentials: "include" });
    if (res.ok) setMaterials(await res.json());
    setSelectedProduct(null);
    setMatQty("1");
  };

  const addMaterialToCreate = (product: CatalogProduct) => {
    setProposalMaterials((prev) => {
      const existing = prev.find((m) => m.dekoramaSku === product.sku);
      if (existing) {
        return prev.map((m) =>
          m.dekoramaSku === product.sku ? { ...m, quantity: m.quantity + 1 } : m,
        );
      }
      return [...prev, { dekoramaSku: product.sku, quantity: 1, name: product.name }];
    });
  };

  const rejectProposal = async (proposalId: string) => {
    await fetch(`${API}/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "rejected" }),
    });
    onRefresh();
  };

  const submitProforma = async (proposalId: string) => {
    await fetch(`${API}/proposals/${proposalId}/ready`, { method: "PATCH", credentials: "include" });
    onRefresh();
  };

  const openProformaDialog = async (proposal: Proposal) => {
    setProformaProposal(proposal);
    const res = await fetch(`${API}/proposals/${proposal.id}/materials`, { credentials: "include" });
    if (res.ok) setProformaMaterials(await res.json());
    setOpenProforma(true);
  };

  const signProposal = async () => {
    if (!proformaProposal) return;
    setSigning(true);
    try {
      await fetch(`${API}/proposals/${proformaProposal.id}/sign`, { method: "PATCH", credentials: "include" });
      setOpenProforma(false);
      onRefresh();
    } finally {
      setSigning(false);
    }
  };

  const downloadPdf = (proposalId: string) => {
    window.open(`${API}/proposals/${proposalId}/proforma.pdf`, "_blank");
  };

  const totalLabor = deptForms.reduce((s, d) => s + (+d.partialLaborCost || 0), 0);
  const proformaMaterialsTotal = proformaMaterials.reduce(
    (sum, m) => sum + Number(m.suggestedPrice) * m.quantity,
    0,
  );
  const proformaGrandTotal = Number(proformaProposal?.laborCost ?? 0) + proformaMaterialsTotal;

  const estimatedDaysTotal = (prop: Proposal) =>
    prop.proposalDepartments?.reduce((s, d) => s + (d.estimatedDays ?? 0), 0) ?? 0;

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={2} mb={2}>
        <Typography variant="h6" fontWeight={700}>Propuestas ({proposals.length})</Typography>
        {isProfessional && !myProposal && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Enviar propuesta
          </Button>
        )}
        {user?.role === "professional" && !user.isVerified && (
          <Alert severity="warning" sx={{ py: 0 }}>Cuenta pendiente de verificación.</Alert>
        )}
      </Stack>

      {proposals.length === 0 && (
        <Paper sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
          <Typography color="text.secondary">Aún no hay propuestas.</Typography>
        </Paper>
      )}

      {proposals.map((prop) => {
        const chip = STATUS_CHIP[prop.status] ?? { label: prop.status, color: "default" as const };
        const isMyProposal = prop.professionalId === user?.id;
        const borderColor =
          prop.status === "signed" ? "#4caf50" :
          prop.status === "proforma_ready" ? "#ff9800" : "#e0e0e0";

        return (
          <Paper key={prop.id} sx={{ p: 3, borderRadius: 3, mb: 2, border: `2px solid ${borderColor}` }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
              <Box flex={1}>
                <Stack direction="row" spacing={1} mb={0.5} flexWrap="wrap">
                  <Chip label={chip.label} color={chip.color} size="small" />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Mano de obra: ${Number(prop.laborCost).toFixed(2)}
                  </Typography>
                  {estimatedDaysTotal(prop) > 0 && (
                    <Chip label={`${estimatedDaysTotal(prop)} días est.`} size="small" variant="outlined" />
                  )}
                </Stack>
                {prop.message && <Typography variant="body2" color="text.secondary">{prop.message}</Typography>}
                {prop.proposalDepartments && prop.proposalDepartments.length > 0 && (
                  <Stack spacing={0.5} mt={1}>
                    {prop.proposalDepartments.map((pd) => {
                      const dept = project.departments.find((d) => d.id === pd.projectDepartmentId);
                      return (
                        <Typography key={pd.id} variant="caption" color="text.secondary">
                          {dept ? DEPARTMENT_LABELS[dept.department] : "Depto"}: ${Number(pd.partialLaborCost).toFixed(2)}
                          {pd.estimatedDays ? ` · ${pd.estimatedDays}d` : ""}
                        </Typography>
                      );
                    })}
                  </Stack>
                )}
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button size="small" variant="outlined" onClick={() => fetchMaterials(prop)}>Materiales</Button>
                {isMyProposal && prop.status === "pending" && (
                  <Button size="small" variant="contained" color="warning" onClick={() => submitProforma(prop.id)}>
                    Finalizar proforma
                  </Button>
                )}
                {isMyProposal && prop.status === "proforma_ready" && (
                  <Button size="small" variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => downloadPdf(prop.id)}>
                    PDF
                  </Button>
                )}
                {isOwner && prop.status === "pending" && (
                  <Button size="small" color="error" variant="outlined" onClick={() => rejectProposal(prop.id)}>Rechazar</Button>
                )}
                {isOwner && prop.status === "proforma_ready" && (
                  <>
                    <Button size="small" variant="contained" color="success" startIcon={<GavelIcon />} onClick={() => openProformaDialog(prop)}>
                      Revisar y firmar
                    </Button>
                    <Button size="small" color="error" variant="outlined" onClick={() => rejectProposal(prop.id)}>Rechazar</Button>
                  </>
                )}
                {prop.status === "signed" && isOwner && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<ShoppingCartIcon />}
                    onClick={async () => {
                      const res = await fetch(`${API}/cart/import-from-proposal/${prop.id}`, {
                        method: "POST",
                        credentials: "include",
                      });
                      if (res.ok) window.location.href = "/carrito";
                    }}
                  >
                    Comprar materiales
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        );
      })}

      <Dialog open={openProposal} onClose={() => setOpenProposal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Enviar propuesta</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {deptForms.map((form, idx) => {
              const dept = project.departments.find((d) => d.id === form.projectDepartmentId);
              return (
                <Paper key={form.projectDepartmentId} sx={{ p: 2 }}>
                  <Typography fontWeight={700} mb={1}>
                    {dept ? DEPARTMENT_LABELS[dept.department] : "Departamento"}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Mano de obra (USD)"
                      type="number"
                      value={form.partialLaborCost}
                      onChange={(e) => {
                        const next = [...deptForms];
                        next[idx] = { ...next[idx], partialLaborCost: e.target.value };
                        setDeptForms(next);
                      }}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Días est."
                      type="number"
                      value={form.estimatedDays}
                      onChange={(e) => {
                        const next = [...deptForms];
                        next[idx] = { ...next[idx], estimatedDays: e.target.value };
                        setDeptForms(next);
                      }}
                      sx={{ width: 120 }}
                    />
                  </Stack>
                </Paper>
              );
            })}
            <Typography variant="subtitle2">Total mano de obra: ${totalLabor.toFixed(2)}</Typography>
            <TextField label="Mensaje" value={message} onChange={(e) => setMessage(e.target.value)} multiline rows={2} fullWidth />
            <Divider />
            <Typography variant="subtitle2" fontWeight={700}>Materiales (opcional)</Typography>
            <Stack direction="row" spacing={1}>
              <TextField label="Buscar" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} size="small" sx={{ flex: 1 }} />
              <Button variant="outlined" onClick={searchProducts} size="small">Buscar</Button>
            </Stack>
            {products.slice(0, 5).map((p) => (
              <Stack key={p.id} direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{p.name} ({p.sku})</Typography>
                <Button size="small" onClick={() => addMaterialToCreate(p)}>+</Button>
              </Stack>
            ))}
            {proposalMaterials.map((m) => (
              <Typography key={m.dekoramaSku} variant="caption">{m.name} x{m.quantity}</Typography>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProposal(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={createProposal}
            disabled={savingProposal || deptForms.some((d) => !d.partialLaborCost)}
          >
            {savingProposal ? "Enviando..." : "Enviar propuesta"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openMaterials} onClose={() => setOpenMaterials(false)} maxWidth="md" fullWidth>
        <DialogTitle>Materiales de la propuesta</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {materials.map((m) => (
              <Stack key={m.id} direction="row" justifyContent="space-between">
                <Typography>{m.productName} x{m.quantity}</Typography>
                <Typography fontWeight={700}>${(Number(m.suggestedPrice) * m.quantity).toFixed(2)}</Typography>
              </Stack>
            ))}
            {user?.role === "professional" && selectedProposalStatus === "pending" && (
              <>
                <Divider />
                <Stack direction="row" spacing={1}>
                  <TextField label="Buscar" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} size="small" sx={{ flex: 1 }} />
                  <Button variant="outlined" onClick={searchProducts} size="small">Buscar</Button>
                </Stack>
                {products.slice(0, 5).map((p) => (
                  <Stack key={p.id} direction="row" justifyContent="space-between" sx={{ cursor: "pointer" }} onClick={() => setSelectedProduct(p)}>
                    <Typography variant="body2">{p.name}</Typography>
                    <Typography>${getProductPrice(p).toFixed(2)}</Typography>
                  </Stack>
                ))}
                {selectedProduct && (
                  <Stack direction="row" spacing={1}>
                    <TextField label="Cant." type="number" value={matQty} onChange={(e) => setMatQty(e.target.value)} size="small" sx={{ width: 80 }} />
                    <Button variant="contained" onClick={addMaterialToProposal} size="small">Agregar</Button>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenMaterials(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openProforma} onClose={() => setOpenProforma(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Revisar proforma</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={600}>Mano de obra</Typography>
              <Typography fontWeight={700}>${Number(proformaProposal?.laborCost ?? 0).toFixed(2)}</Typography>
            </Stack>
            {proformaMaterials.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell align="right">Cant.</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proformaMaterials.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.productName}</TableCell>
                      <TableCell align="right">{m.quantity}</TableCell>
                      <TableCell align="right">${(Number(m.suggestedPrice) * m.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700}>TOTAL</Typography>
              <Typography variant="h6" fontWeight={700}>${proformaGrandTotal.toFixed(2)}</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProforma(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={signProposal} disabled={signing}>
            {signing ? "Firmando..." : "Firmar y aceptar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
