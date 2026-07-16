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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, PictureAsPdf, Visibility } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../components/AppShell";
import { useCurrentUser, API } from "../hooks/useCurrentUser";
import { AdminInvitationsTab } from "./components/AdminInvitationsTab";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  profileData: any;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  proposalId: string | null;
  clientId: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: "draft" | "issued" | "paid" | "cancelled";
  notes: string | null;
  lineItems: Array<{
    id: string;
    description: string;
    productSku: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  createdAt: string;
}

interface Proposal {
  id: string;
  projectId: string;
  project: { title: string; clientId: string };
  professionalId: string;
  laborCost: number;
  message: string | null;
  status: string;
}

interface LineItemForm {
  description: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
}

export default function AdminPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const [tab, setTab] = useState(0);

  // Professionals
  const [pendingPros, setPendingPros] = useState<PendingUser[]>([]);
  const [loadingPros, setLoadingPros] = useState(true);

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchInvoice, setSearchInvoice] = useState("");
  
  // Invoice dialogs
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceMode, setInvoiceMode] = useState<"proposal" | "manual">("proposal");
  const [selectedProposal, setSelectedProposal] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<PendingUser[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState(16);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { description: "", productSku: "", quantity: 1, unitPrice: 0 },
  ]);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteInvoiceDialog, setDeleteInvoiceDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const fetchPros = () => {
    fetch(`${API}/admin/users?role=professional&isVerified=false`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then(setPendingPros)
      .finally(() => setLoadingPros(false));
  };

  useEffect(() => {
    if (!userLoading) {
      fetchPros();
    }
  }, [userLoading]);

  const verify = async (id: string, isVerified: boolean) => {
    await fetch(`${API}/admin/users/${id}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isVerified }),
    });
    fetchPros();
  };

  // Invoice functions
  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const url = filterStatus === "all" 
        ? `${API}/invoices` 
        : `${API}/invoices?status=${filterStatus}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchSignedProposals = async () => {
    try {
      const res = await fetch(`${API}/proposals/mine`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProposals(data.filter((p: Proposal) => p.status === "signed"));
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API}/admin/users?role=client`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const openCreateInvoiceDialog = async () => {
    await fetchSignedProposals();
    await fetchClients();
    resetInvoiceForm();
    setInvoiceDialogOpen(true);
  };

  const resetInvoiceForm = () => {
    setSelectedProposal("");
    setSelectedClient("");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
    setTaxRate(16);
    setNotes("");
    setLineItems([{ description: "", productSku: "", quantity: 1, unitPrice: 0 }]);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", productSku: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItemForm, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleCreateInvoice = async () => {
    setSavingInvoice(true);
    try {
      if (invoiceMode === "proposal") {
        const res = await fetch(`${API}/invoices/from-proposal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            proposalId: selectedProposal,
            issueDate,
            dueDate: dueDate || null,
            taxRate,
            notes: notes || null,
          }),
        });
        if (res.ok) {
          setInvoiceDialogOpen(false);
          fetchInvoices();
        }
      } else {
        const res = await fetch(`${API}/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            clientId: selectedClient,
            issueDate,
            dueDate: dueDate || null,
            taxRate,
            lineItems: lineItems.map(item => ({
              description: item.description,
              productSku: item.productSku || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
            notes: notes || null,
          }),
        });
        if (res.ok) {
          setInvoiceDialogOpen(false);
          fetchInvoices();
        }
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
    } finally {
      setSavingInvoice(false);
    }
  };

  const openViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewInvoiceDialog(true);
  };

  const handleDownloadPdf = (invoiceId: string) => {
    window.open(`${API}/invoices/${invoiceId}/pdf`, "_blank");
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      const res = await fetch(`${API}/invoices/${invoiceToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setDeleteInvoiceDialog(false);
        setInvoiceToDelete(null);
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const handleChangeStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API}/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchInvoices();
        if (selectedInvoice?.id === invoiceId) {
          const updated = await res.json();
          setSelectedInvoice(updated);
        }
      }
    } catch (error) {
      console.error("Error changing status:", error);
    }
  };

  // Update useEffect to fetch invoices when tab 2 is selected
  useEffect(() => {
    if (tab === 2 && !userLoading) {
      fetchInvoices();
    }
  }, [tab, filterStatus, userLoading]);

  if (!userLoading && user?.role !== "admin") {
    return (
      <Alert severity="error">
        Acceso denegado. Solo administradores.
      </Alert>
    );
  }

  return (
    <AppShell title="Administración" user={user}>
      {userLoading ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label={`Profesionales pendientes (${pendingPros.length})`} />
            <Tab label="Catálogo de productos" />
            <Tab label="Facturas" />
            <Tab label="Invitaciones Admin" />
          </Tabs>

          {/* Tab 0: Pending professionals */}
          {tab === 0 && (
            <Stack spacing={2}>
              {loadingPros ? <CircularProgress /> : null}
              {!loadingPros && pendingPros.length === 0 && (
                <Paper sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
                  <Typography color="text.secondary">
                    No hay profesionales pendientes de verificación.
                  </Typography>
                </Paper>
              )}
              {pendingPros.map((pro) => (
                <Paper key={pro.id} sx={{ p: 3, borderRadius: 3 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    flexWrap="wrap"
                    gap={2}
                  >
                    <Box>
                      <Typography fontWeight={700}>{pro.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pro.email}
                      </Typography>
                      {pro.profileData?.specialties?.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          mt={0.5}
                          flexWrap="wrap"
                        >
                          {(pro.profileData.specialties as string[]).map(
                            (s) => (
                              <Chip
                                key={s}
                                label={s}
                                size="small"
                                variant="outlined"
                              />
                            )
                          )}
                        </Stack>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        📎 Documentos (RIF, certificaciones) — Próximamente
                        (Google Cloud Storage)
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => verify(pro.id, true)}
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => verify(pro.id, false)}
                      >
                        Rechazar
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          {/* Tab 1: Product catalog - redirect to dedicated page */}
          {tab === 1 && (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>
                Gestión de Catálogo de Productos
              </Typography>
              <Typography color="text.secondary" mb={3}>
                Administra el catálogo completo de productos con familias,
                subfamilias y SKU automático.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push("/admin/productos")}
              >
                Ir al Catálogo de Productos
              </Button>
            </Paper>
          )}

          {/* Tab 2: Invoices */}
          {tab === 2 && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  placeholder="Buscar por número o cliente..."
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Estado"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="draft">Borrador</MenuItem>
                    <MenuItem value="issued">Emitida</MenuItem>
                    <MenuItem value="paid">Pagada</MenuItem>
                    <MenuItem value="cancelled">Cancelada</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openCreateInvoiceDialog}
                >
                  Nueva Factura
                </Button>
              </Stack>

              {loadingInvoices ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Número</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell align="right">IVA</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices
                        .filter((inv) =>
                          searchInvoice
                            ? inv.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
                              inv.clientName.toLowerCase().includes(searchInvoice.toLowerCase())
                            : true
                        )
                        .map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>{invoice.invoiceNumber}</TableCell>
                            <TableCell>{invoice.clientName}</TableCell>
                            <TableCell>
                              {new Date(invoice.issueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              ${invoice.subtotal.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              ${invoice.taxAmount.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              <strong>${invoice.total.toFixed(2)}</strong>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={invoice.status}
                                color={
                                  invoice.status === "paid"
                                    ? "success"
                                    : invoice.status === "issued"
                                    ? "primary"
                                    : invoice.status === "draft"
                                    ? "default"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <IconButton
                                  size="small"
                                  onClick={() => openViewInvoice(invoice)}
                                  title="Ver detalles"
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadPdf(invoice.id)}
                                  title="Descargar PDF"
                                >
                                  <PictureAsPdf fontSize="small" />
                                </IconButton>
                                {invoice.status === "draft" && (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setInvoiceToDelete(invoice);
                                      setDeleteInvoiceDialog(true);
                                    }}
                                    title="Eliminar"
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {invoices.length === 0 && (
                    <Box p={4} textAlign="center">
                      <Typography color="text.secondary">
                        No hay facturas registradas.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}
            </Stack>
          )}

          {/* Tab 3: Admin Invitations */}
          {tab === 3 && <AdminInvitationsTab />}
        </Stack>
      )}

      {/* Create Invoice Dialog */}
      <Dialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nueva Factura</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={invoiceMode}
              exclusive
              onChange={(_, val) => val && setInvoiceMode(val)}
              fullWidth
            >
              <ToggleButton value="proposal">Desde Propuesta</ToggleButton>
              <ToggleButton value="manual">Manual</ToggleButton>
            </ToggleButtonGroup>

            {invoiceMode === "proposal" ? (
              <FormControl fullWidth>
                <InputLabel>Propuesta Firmada</InputLabel>
                <Select
                  value={selectedProposal}
                  label="Propuesta Firmada"
                  onChange={(e) => setSelectedProposal(e.target.value)}
                >
                  {proposals.map((prop) => (
                    <MenuItem key={prop.id} value={prop.id}>
                      {prop.project.title} - ${prop.laborCost.toFixed(2)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <>
                <FormControl fullWidth>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    value={selectedClient}
                    label="Cliente"
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Conceptos
                </Typography>
                {lineItems.map((item, index) => (
                  <Stack key={index} direction="row" spacing={1} alignItems="center">
                    <TextField
                      label="Descripción"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, "description", e.target.value)}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="SKU (opcional)"
                      value={item.productSku}
                      onChange={(e) => updateLineItem(index, "productSku", e.target.value)}
                      sx={{ width: 150 }}
                      size="small"
                    />
                    <TextField
                      label="Cantidad"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, "quantity", +e.target.value)}
                      sx={{ width: 100 }}
                      size="small"
                    />
                    <TextField
                      label="Precio"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, "unitPrice", +e.target.value)}
                      sx={{ width: 120 }}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                ))}
                <Button size="small" onClick={addLineItem} startIcon={<Add />}>
                  Agregar Concepto
                </Button>
              </>
            )}

            <TextField
              label="Fecha de Emisión"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Fecha de Vencimiento (opcional)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Tasa de IVA (%)"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(+e.target.value)}
              fullWidth
            />
            <TextField
              label="Notas (opcional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateInvoice}
            disabled={
              savingInvoice ||
              (invoiceMode === "proposal" ? !selectedProposal : !selectedClient)
            }
          >
            {savingInvoice ? <CircularProgress size={20} /> : "Crear Factura"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog
        open={viewInvoiceDialog}
        onClose={() => setViewInvoiceDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedInvoice && (
          <>
            <DialogTitle>
              Factura {selectedInvoice.invoiceNumber}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary">
                      Cliente
                    </Typography>
                    <Typography>{selectedInvoice.clientName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedInvoice.clientEmail}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Estado
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 150, display: "block", mt: 0.5 }}>
                      <Select
                        value={selectedInvoice.status}
                        onChange={(e) => handleChangeStatus(selectedInvoice.id, e.target.value)}
                      >
                        <MenuItem value="draft">Borrador</MenuItem>
                        <MenuItem value="issued">Emitida</MenuItem>
                        <MenuItem value="paid">Pagada</MenuItem>
                        <MenuItem value="cancelled">Cancelada</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Fecha de Emisión
                    </Typography>
                    <Typography>
                      {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {selectedInvoice.dueDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Fecha de Vencimiento
                      </Typography>
                      <Typography>
                        {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Conceptos
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell align="right">Cant.</TableCell>
                        <TableCell align="right">Precio</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedInvoice.lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.productSku || "-"}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            ${item.unitPrice.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ${item.lineTotal.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

                <Stack spacing={1} alignItems="flex-end">
                  <Stack direction="row" spacing={2} justifyContent="space-between" width="250px">
                    <Typography>Subtotal:</Typography>
                    <Typography>${selectedInvoice.subtotal.toFixed(2)}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} justifyContent="space-between" width="250px">
                    <Typography>IVA ({selectedInvoice.taxRate}%):</Typography>
                    <Typography>${selectedInvoice.taxAmount.toFixed(2)}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} justifyContent="space-between" width="250px">
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6">
                      ${selectedInvoice.total.toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>

                {selectedInvoice.notes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Notas
                    </Typography>
                    <Typography>{selectedInvoice.notes}</Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleDownloadPdf(selectedInvoice.id)}>
                Descargar PDF
              </Button>
              <Button onClick={() => setViewInvoiceDialog(false)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Invoice Dialog */}
      <Dialog
        open={deleteInvoiceDialog}
        onClose={() => setDeleteInvoiceDialog(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar la factura{" "}
            <strong>{invoiceToDelete?.invoiceNumber}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteInvoiceDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteInvoice}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
