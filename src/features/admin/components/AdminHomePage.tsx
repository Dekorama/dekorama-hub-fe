"use client";

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
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Add, Delete, PictureAsPdf, Visibility } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/features/auth/hooks/useCurrentUser";
import { AdminInvitationsTab } from "@/features/admin/components/AdminInvitationsTab";
import { AdminTabPanel } from "@/features/admin/components/AdminTabPanel";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { LabeledSelect } from "@/shared/components/LabeledSelect";
import { PageToolbar, ResponsiveTable, ScrollableTabs, TableEmptyRow, TableLoadingRow } from "@/shared/ui";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  profileData: any;
  taxRate?: number | null;
  taxExempt?: boolean;
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
  projectId: string | null;
  project: { title: string; clientId: string } | null;
  clientId: string | null;
  title: string | null;
  professionalId: string | null;
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

export function AdminHomePage() {
  const router = useRouter();
  const { market, config } = useAdminMarket();
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
  const [taxExempt, setTaxExempt] = useState(false);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { description: "", productSku: "", quantity: 1, unitPrice: 0 },
  ]);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteInvoiceDialog, setDeleteInvoiceDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  useEffect(() => {
    setTaxRate(config.taxRate);
  }, [config.taxRate, market]);

  const fetchPros = () => {
    fetch(adminApiUrl("/admin/users?role=professional&isVerified=false", market), {
      credentials: "include",
    })
      .then((r) => r.json())
      .then(setPendingPros)
      .finally(() => setLoadingPros(false));
  };

  useEffect(() => {
    fetchPros();
    fetchInvoices();
  }, [market]);

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus, market]);

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
        ? adminApiUrl("/invoices", market)
        : adminApiUrl(`/invoices?status=${filterStatus}`, market);
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
      const res = await fetch(adminApiUrl("/admin/users?role=client", market), { credentials: "include" });
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
    setTaxRate(config.taxRate);
    setTaxExempt(false);
    setNotes("");
    setLineItems([{ description: "", productSku: "", quantity: 1, unitPrice: 0 }]);
  };

  const applyClientTax = (client: PendingUser | undefined) => {
    if (!client) {
      setTaxExempt(false);
      setTaxRate(config.taxRate);
      return;
    }
    if (client.taxExempt) {
      setTaxExempt(true);
      setTaxRate(0);
      return;
    }
    setTaxExempt(false);
    setTaxRate(
      client.taxRate !== undefined && client.taxRate !== null
        ? Number(client.taxRate)
        : config.taxRate,
    );
  };

  const persistClientTax = async (clientId: string) => {
    await fetch(`${API}/admin/users/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        taxExempt,
        taxRate: taxExempt ? 0 : taxRate,
      }),
    });
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
      const effectiveTaxRate = taxExempt ? 0 : taxRate;
      if (invoiceMode === "proposal") {
        const proposal = proposals.find((p) => p.id === selectedProposal);
        const clientId = proposal?.clientId ?? proposal?.project?.clientId;
        if (clientId) await persistClientTax(clientId);
        const res = await fetch(`${API}/invoices/from-proposal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            proposalId: selectedProposal,
            issueDate,
            dueDate: dueDate || null,
            taxRate: effectiveTaxRate,
            notes: notes || null,
          }),
        });
        if (res.ok) {
          setInvoiceDialogOpen(false);
          fetchInvoices();
        }
      } else {
        if (selectedClient) await persistClientTax(selectedClient);
        const res = await fetch(`${API}/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            clientId: selectedClient,
            issueDate,
            dueDate: dueDate || null,
            taxRate: effectiveTaxRate,
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

  // Invoices refresh when filter changes (initial load in mount effect above)
  return (
    <>
      <Stack spacing={0}>
      <ScrollableTabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 9,
          bgcolor: "background.default",
          borderBottom: 1,
          borderColor: "divider",
          minHeight: 48,
          mb: 0,
          "& .MuiTab-root": { minHeight: 48, textTransform: "none", fontWeight: 500 },
        }}
      >
        <Tab
          id="admin-tab-0"
          aria-controls="admin-tabpanel-0"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Profesionales</span>
              {pendingPros.length > 0 && (
                <Chip label={pendingPros.length} size="small" color="warning" sx={{ height: 20, fontSize: 11 }} />
              )}
            </Stack>
          }
        />
        <Tab id="admin-tab-1" aria-controls="admin-tabpanel-1" label="Catálogo" />
        <Tab id="admin-tab-2" aria-controls="admin-tabpanel-2" label="Facturas" />
        <Tab id="admin-tab-3" aria-controls="admin-tabpanel-3" label="Invitaciones" />
      </ScrollableTabs>

      <AdminTabPanel value={tab} index={0}>
        <Stack spacing={2}>
          {loadingPros ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={28} />
            </Box>
          ) : null}
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
                        📎 Documentos (RIF, certificaciones). Próximamente
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
      </AdminTabPanel>

      <AdminTabPanel value={tab} index={1}>
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
      </AdminTabPanel>

      <AdminTabPanel value={tab} index={2}>
        <Stack spacing={2}>
              <PageToolbar>
                <TextField
                  placeholder="Buscar por número o cliente..."
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <LabeledSelect
                  label="Estado"
                  size="small"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(String(e.target.value))}
                  formControlProps={{ size: "small", sx: { minWidth: 200 } }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="draft">Borrador</MenuItem>
                  <MenuItem value="issued">Emitida</MenuItem>
                  <MenuItem value="paid">Pagada</MenuItem>
                  <MenuItem value="cancelled">Cancelada</MenuItem>
                </LabeledSelect>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openCreateInvoiceDialog}
                >
                  Nueva Factura
                </Button>
              </PageToolbar>

              <ResponsiveTable minWidth={720}>
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
                  {loadingInvoices ? (
                    <TableLoadingRow colSpan={8} />
                  ) : invoices.length === 0 ? (
                    <TableEmptyRow colSpan={8} message="No hay facturas registradas." />
                  ) : (
                    invoices
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
                      ))
                  )}
                </TableBody>
              </ResponsiveTable>
        </Stack>
      </AdminTabPanel>

      <AdminTabPanel value={tab} index={3}>
        <AdminInvitationsTab />
      </AdminTabPanel>
    </Stack>

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
              <LabeledSelect
                label="Propuesta Firmada"
                value={selectedProposal}
                emptyLabel="Seleccionar propuesta"
                fullWidth
                formControlProps={{ fullWidth: true }}
                onChange={(e) => {
                  const id = String(e.target.value);
                  setSelectedProposal(id);
                  const prop = proposals.find((p) => p.id === id);
                  const clientId = prop?.clientId ?? prop?.project?.clientId;
                  applyClientTax(clients.find((c) => c.id === clientId));
                }}
              >
                {proposals.map((prop) => (
                  <MenuItem key={prop.id} value={prop.id}>
                    {prop.project?.title ?? prop.title ?? "Sin proyecto"} - $
                    {Number(prop.laborCost).toFixed(2)}
                  </MenuItem>
                ))}
              </LabeledSelect>
            ) : (
              <>
                <LabeledSelect
                  label="Cliente"
                  value={selectedClient}
                  emptyLabel="Seleccionar cliente"
                  fullWidth
                  formControlProps={{ fullWidth: true }}
                  onChange={(e) => {
                    const id = String(e.target.value);
                    setSelectedClient(id);
                    applyClientTax(clients.find((c) => c.id === id));
                  }}
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name} ({client.email})
                      {client.taxExempt ? " · Exento IVA" : ""}
                    </MenuItem>
                  ))}
                </LabeledSelect>

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
            <FormControlLabel
              control={
                <Checkbox
                  checked={taxExempt}
                  onChange={(e) => {
                    setTaxExempt(e.target.checked);
                    if (e.target.checked) setTaxRate(0);
                    else setTaxRate(config.taxRate);
                  }}
                />
              }
              label="Exento de IVA"
            />
            <TextField
              label="Tasa de IVA (%)"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(+e.target.value)}
              disabled={taxExempt}
              helperText="Se guarda en el cliente al crear la factura"
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
                    <LabeledSelect
                      label="Estado"
                      size="small"
                      value={selectedInvoice.status}
                      onChange={(e) => handleChangeStatus(selectedInvoice.id, String(e.target.value))}
                      formControlProps={{
                        size: "small",
                        sx: { minWidth: 150, display: "block", mt: 0.5 },
                      }}
                    >
                      <MenuItem value="draft">Borrador</MenuItem>
                      <MenuItem value="issued">Emitida</MenuItem>
                      <MenuItem value="paid">Pagada</MenuItem>
                      <MenuItem value="cancelled">Cancelada</MenuItem>
                    </LabeledSelect>
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
    </>
  );
}
