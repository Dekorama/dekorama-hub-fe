"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GavelIcon from "@mui/icons-material/Gavel";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../components/AppShell";
import { useCurrentUser, API } from "../../hooks/useCurrentUser";

interface Project { id: string; title: string; description: string; isPublic: boolean; status: string; budget: number|null; location: string|null; clientId: string; }
interface Proposal { id: string; professionalId: string; laborCost: number; message: string|null; status: string; createdAt: string; }
interface Material { id: string; productSku: string; productName: string; quantity: number; suggestedPrice: number; }
interface Product { id: string; sku: string; name: string; price: number; category: string|null; }

const STATUS_CHIP: Record<string, { label: string; color: "default"|"warning"|"success"|"error" }> = {
  pending:        { label: "Pendiente",       color: "default" },
  proforma_ready: { label: "Proforma lista",  color: "warning" },
  signed:         { label: "Firmada \u2713",   color: "success" },
  rejected:       { label: "Rechazada",       color: "error" },
};

export default function ProyectoDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, loading: userLoading } = useCurrentUser();

  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Create proposal dialog
  const [openProposal, setOpenProposal] = useState(false);
  const [laborCost, setLaborCost] = useState("");
  const [message, setMessage] = useState("");
  const [savingProposal, setSavingProposal] = useState(false);

  // Materials dialog (add/view)
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [selectedProposalStatus, setSelectedProposalStatus] = useState<string>("pending");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [openMaterials, setOpenMaterials] = useState(false);
  const [matQty, setMatQty] = useState("1");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Proforma review dialog (client signs)
  const [openProforma, setOpenProforma] = useState(false);
  const [proformaProposal, setProformaProposal] = useState<Proposal | null>(null);
  const [proformaMaterials, setProformaMaterials] = useState<Material[]>([]);
  const [signing, setSigning] = useState(false);

  const fetchAll = async () => {
    const [projRes, propRes] = await Promise.all([
      fetch(`${API}/projects/${projectId}`, { credentials: "include" }),
      fetch(`${API}/projects/${projectId}/proposals`, { credentials: "include" }),
    ]);
    if (projRes.ok) setProject(await projRes.json());
    if (propRes.ok) setProposals(await propRes.json());
    setLoading(false);
  };

  useEffect(() => { if (!userLoading) fetchAll(); }, [userLoading]);

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

  const addMaterial = async () => {
    if (!selectedProduct || !selectedProposalId) return;
    await fetch(`${API}/proposals/${selectedProposalId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        productSku: selectedProduct.sku,
        productName: selectedProduct.name,
        quantity: +matQty,
        suggestedPrice: selectedProduct.price,
      }),
    });
    const res = await fetch(`${API}/proposals/${selectedProposalId}/materials`, { credentials: "include" });
    if (res.ok) setMaterials(await res.json());
    setSelectedProduct(null); setMatQty("1");
  };

  const createProposal = async () => {
    setSavingProposal(true);
    try {
      await fetch(`${API}/projects/${projectId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ laborCost: +laborCost, message: message || undefined }),
      });
      setOpenProposal(false); setLaborCost(""); setMessage("");
      fetchAll();
    } finally {
      setSavingProposal(false);
    }
  };

  const rejectProposal = async (proposalId: string) => {
    await fetch(`${API}/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "rejected" }),
    });
    fetchAll();
  };

  const submitProforma = async (proposalId: string) => {
    await fetch(`${API}/proposals/${proposalId}/ready`, {
      method: "PATCH",
      credentials: "include",
    });
    fetchAll();
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
      await fetch(`${API}/proposals/${proformaProposal.id}/sign`, {
        method: "PATCH",
        credentials: "include",
      });
      setOpenProforma(false);
      fetchAll();
    } finally {
      setSigning(false);
    }
  };

  const downloadPdf = (proposalId: string) => {
    window.open(`${API}/proposals/${proposalId}/proforma.pdf`, "_blank");
  };

  const isOwner = project && user && project.clientId === user.id;
  const isProfessional = user?.role === "professional" && user.isVerified;
  const myProposal = proposals.find((p) => p.professionalId === user?.id);

  const proformaMaterialsTotal = proformaMaterials.reduce(
    (sum, m) => sum + Number(m.suggestedPrice) * m.quantity,
    0,
  );
  const proformaGrandTotal = Number(proformaProposal?.laborCost ?? 0) + proformaMaterialsTotal;

  return (
    <AppShell title={project?.title ?? "Proyecto"} user={user}>
      {loading || userLoading ? (
        <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
      ) : !project ? (
        <Alert severity="error">Proyecto no encontrado</Alert>
      ) : (
        <Stack spacing={3}>
          {/* Project info */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
            <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" gap={0.5}>
              <Chip label={project.isPublic ? "Público" : "Privado"} color={project.isPublic ? "success" : "default"} size="small" />
              <Chip label={project.status} size="small" variant="outlined" />
              {project.budget && <Chip label={`$${project.budget}`} size="small" variant="outlined" />}
              {project.location && <Chip label={project.location} size="small" variant="outlined" />}
            </Stack>
            <Typography variant="body1" color="text.secondary">{project.description}</Typography>
          </Paper>

          {/* Proposals */}
          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={2} mb={2}>
              <Typography variant="h6" fontWeight={700}>Propuestas ({proposals.length})</Typography>
              {isProfessional && !myProposal && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenProposal(true)} sx={{ width: { xs: "100%", sm: "auto" } }}>
                  Enviar propuesta
                </Button>
              )}
              {user?.role === "professional" && !user.isVerified && (
                <Alert severity="warning" sx={{ py: 0 }}>Tu cuenta está pendiente de verificación.</Alert>
              )}
            </Stack>

            {proposals.length === 0 && (
              <Paper sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
                <Typography color="text.secondary">Aún no hay propuestas para este proyecto.</Typography>
              </Paper>
            )}

            {proposals.map((prop) => {
              const chip = STATUS_CHIP[prop.status] ?? { label: prop.status, color: "default" as const };
              const isMyProposal = prop.professionalId === user?.id;
              const borderColor =
                prop.status === "signed" ? "#4caf50" :
                prop.status === "proforma_ready" ? "#ff9800" :
                "#e0e0e0";
              const borderWidth = prop.status === "signed" || prop.status === "proforma_ready" ? "2px" : "1px";

              return (
                <Paper key={prop.id} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 2, border: `${borderWidth} solid ${borderColor}` }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Box flex={1}>
                      <Stack direction="row" spacing={1} mb={0.5} alignItems="center" flexWrap="wrap">
                        <Chip label={chip.label} color={chip.color} size="small" />
                        <Typography variant="subtitle1" fontWeight={700}>Mano de obra: ${Number(prop.laborCost).toFixed(2)}</Typography>
                      </Stack>
                      {prop.message && <Typography variant="body2" color="text.secondary">{prop.message}</Typography>}
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" alignItems="stretch" sx={{ width: { xs: "100%", sm: "auto" } }}>
                      {/* Materials button — always visible */}
                      <Button size="small" variant="outlined" onClick={() => fetchMaterials(prop)}>
                        Materiales
                      </Button>

                      {/* --- Professional actions --- */}
                      {isMyProposal && prop.status === "pending" && (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          onClick={() => submitProforma(prop.id)}
                        >
                          Finalizar proforma
                        </Button>
                      )}
                      {isMyProposal && prop.status === "proforma_ready" && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PictureAsPdfIcon />}
                          onClick={() => downloadPdf(prop.id)}
                        >
                          Descargar PDF
                        </Button>
                      )}

                      {/* --- Client actions --- */}
                      {isOwner && prop.status === "pending" && (
                        <Button size="small" color="error" variant="outlined" onClick={() => rejectProposal(prop.id)}>
                          Rechazar
                        </Button>
                      )}
                      {isOwner && prop.status === "proforma_ready" && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<GavelIcon />}
                            onClick={() => openProformaDialog(prop)}
                          >
                            Revisar y firmar
                          </Button>
                          <Button size="small" color="error" variant="outlined" onClick={() => rejectProposal(prop.id)}>
                            Rechazar
                          </Button>
                        </>
                      )}
                      {prop.status === "signed" && isOwner && (
                        <Button 
                          size="small" 
                          variant="contained" 
                          startIcon={<ShoppingCartIcon />} 
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API}/cart/import-from-proposal/${prop.id}`, {
                                method: "POST",
                                credentials: "include",
                              });
                              if (!res.ok) {
                                const errorData = await res.json();
                                throw new Error(errorData.message || "Error al importar materiales");
                              }
                              // Redirect to cart
                              window.location.href = "/carrito";
                            } catch (err: unknown) {
                              alert(err instanceof Error ? err.message : "Error al importar materiales al carrito");
                            }
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
          </Box>
        </Stack>
      )}

      {/* Create Proposal Dialog */}
      <Dialog open={openProposal} onClose={() => setOpenProposal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enviar propuesta</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Costo de mano de obra (USD)" type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} required fullWidth />
            <TextField label="Mensaje / descripción de la propuesta" value={message} onChange={(e) => setMessage(e.target.value)} multiline rows={3} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProposal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={createProposal} disabled={savingProposal || !laborCost}>
            {savingProposal ? "Enviando..." : "Enviar propuesta"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Materials Dialog */}
      <Dialog open={openMaterials} onClose={() => setOpenMaterials(false)} maxWidth="md" fullWidth>
        <DialogTitle>Lista de materiales</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {materials.length === 0 ? (
              <Typography color="text.secondary">No hay materiales agregados.</Typography>
            ) : (
              materials.map((m) => (
                <Stack key={m.id} direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight={600}>{m.productName}</Typography>
                    <Typography variant="caption" color="text.secondary">SKU: {m.productSku} · Cantidad: {m.quantity}</Typography>
                  </Box>
                  <Typography fontWeight={700}>${(Number(m.suggestedPrice) * m.quantity).toFixed(2)}</Typography>
                </Stack>
              ))
            )}

            {/* Add material — only for proposal author while PENDING */}
            {user?.role === "professional" && selectedProposalId && selectedProposalStatus === "pending" && (
              <>
                <Divider />
                <Typography variant="subtitle2" fontWeight={700}>Agregar material del catálogo</Typography>
                <Stack direction="row" spacing={1}>
                  <TextField label="Buscar producto" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} size="small" sx={{ flex: 1 }} />
                  <Button variant="outlined" onClick={searchProducts} size="small">Buscar</Button>
                </Stack>
                {products.slice(0, 5).map((p) => (
                  <Stack key={p.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1, border: selectedProduct?.id === p.id ? "2px solid #ff6f00" : "1px solid #e0e0e0", borderRadius: 1, cursor: "pointer" }} onClick={() => setSelectedProduct(p)}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">SKU: {p.sku} · {p.category}</Typography>
                    </Box>
                    <Typography fontWeight={700}>${p.price}</Typography>
                  </Stack>
                ))}
                {selectedProduct && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField label="Cantidad" type="number" value={matQty} onChange={(e) => setMatQty(e.target.value)} size="small" sx={{ width: 100 }} />
                    <Button variant="contained" onClick={addMaterial} size="small">Agregar</Button>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMaterials(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Proforma Review & Sign Dialog */}
      <Dialog open={openProforma} onClose={() => setOpenProforma(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Revisar proforma</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              Revisá el desglose de costos antes de firmar. Una vez firmado, las demás propuestas serán rechazadas y el proyecto comenzará.
            </Typography>
            <Divider />
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
                    <TableCell align="right">P. unit.</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proformaMaterials.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.productName}</TableCell>
                      <TableCell align="right">{m.quantity}</TableCell>
                      <TableCell align="right">${Number(m.suggestedPrice).toFixed(2)}</TableCell>
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
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => proformaProposal && downloadPdf(proformaProposal.id)}
            >
              Descargar PDF
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProforma(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<GavelIcon />}
            onClick={signProposal}
            disabled={signing}
          >
            {signing ? "Firmando..." : "Firmar y aceptar"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
