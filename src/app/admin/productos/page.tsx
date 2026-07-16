"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useCurrentUser, API } from "../../hooks/useCurrentUser";
import { useAppSnackbar } from "../../hooks/useAppSnackbar";
import { useAdminMarket } from "../context/AdminMarketContext";
import { adminApiUrl } from "../utils/adminApi";
import { readApiError } from "../utils/readApiError";
import { LabeledSelect } from "../../components/LabeledSelect";

type PricingMode = "neto" | "pvp";
type FinishType = "decorado" | "pieza_lisa";

interface Product {
  id: string;
  sku: string;
  name: string;
  family: string;
  familyName: string;
  subfamily: string;
  subfamilyName: string;
  pricingMode: PricingMode;
  finishType: FinishType | null;
  factoryCost: number;
  profitMargin: number;
  pvpPrice: number;
  unit: string;
  stock: number;
  description: string | null;
  isActive: boolean;
}

interface Family {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface FactoryCodeRecord {
  id: string;
  supplierId: string;
  productSku: string;
  factoryCode: string;
  factoryCost: number | null;
  isPrimary: boolean;
  supplier?: { name: string };
}

interface Subfamily {
  code: string;
  familyCode: string;
  name: string;
  description: string | null;
  supplierId?: string | null;
}

function normalizeProduct(raw: Product): Product {
  return {
    ...raw,
    pricingMode: raw.pricingMode === "pvp" ? "pvp" : "neto",
    finishType: raw.finishType ?? null,
    factoryCost: Number(raw.factoryCost),
    profitMargin: Number(raw.profitMargin),
    pvpPrice: Number(raw.pvpPrice),
    stock: Number(raw.stock),
  };
}

export default function ProductosAdminPage() {
  const { user } = useCurrentUser();
  const { market } = useAdminMarket();
  const { showSuccess, showError, showWarning, SnackbarHost } = useAppSnackbar();
  const [products, setProducts] = useState<Product[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [subfamilies, setSubfamilies] = useState<Subfamily[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [filterFamily, setFilterFamily] = useState("");
  const [filterSubfamily, setFilterSubfamily] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Form states
  const [formName, setFormName] = useState("");
  const [formFamily, setFormFamily] = useState("");
  const [formSubfamily, setFormSubfamily] = useState("");
  const [formPricingMode, setFormPricingMode] = useState<PricingMode>("neto");
  const [formFinishType, setFormFinishType] = useState<FinishType | "">("");
  const [formFactoryCost, setFormFactoryCost] = useState<number>(0);
  const [formProfitMargin, setFormProfitMargin] = useState<number>(40);
  const [formPvpPrice, setFormPvpPrice] = useState<number>(0);
  const [formUnit, setFormUnit] = useState("unidad");
  const [formStock, setFormStock] = useState<number>(0);
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const isSpainMarket = market === "ES";
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formSupplierFactoryCode, setFormSupplierFactoryCode] = useState("");
  const [loadingFactoryCode, setLoadingFactoryCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSubfamilies, setLoadingSubfamilies] = useState(false);

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [wizSupplier, setWizSupplier] = useState({ name: "", email: "" });
  const [wizSupplierId, setWizSupplierId] = useState("");
  const [wizFactoryCode, setWizFactoryCode] = useState("");
  const [wizFamily, setWizFamily] = useState({ code: "", name: "" });
  const [createdSku, setCreatedSku] = useState("");

  useEffect(() => {
    fetchData();
  }, [market]);

  useEffect(() => {
    if (filterFamily) {
      fetchSubfamilies(filterFamily);
    }
  }, [filterFamily]);

  async function fetchData() {
    setLoading(true);
    setLoadError("");
    try {
      const [productsRes, familiesRes, suppliersRes] = await Promise.all([
        fetch(adminApiUrl("/products", market), { credentials: "include" }),
        fetch(`${API}/products/families/all`, { credentials: "include" }),
        fetch(adminApiUrl("/suppliers", market), { credentials: "include" }),
      ]);

      if (!productsRes.ok) {
        setProducts([]);
        setLoadError(await readApiError(productsRes, "Error al cargar productos"));
        return;
      }

      const data: Product[] = await productsRes.json();
      setProducts(data.map(normalizeProduct));

      if (familiesRes.ok) {
        setFamilies(await familiesRes.json());
      }

      if (suppliersRes.ok) {
        setSuppliers(await suppliersRes.json());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoadError("No se pudieron cargar los productos");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubfamilies(familyCode: string) {
    if (!familyCode) {
      setSubfamilies([]);
      return;
    }
    setLoadingSubfamilies(true);
    try {
      const res = await fetch(
        `${API}/products/subfamilies/all?family=${familyCode}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setSubfamilies(data);
      }
    } catch (error) {
      console.error("Error fetching subfamilies:", error);
    } finally {
      setLoadingSubfamilies(false);
    }
  }

  async function loadProductFactoryCode(sku: string) {
    setLoadingFactoryCode(true);
    setFormSupplierId("");
    setFormSupplierFactoryCode("");
    try {
      const res = await fetch(
        adminApiUrl(`/suppliers/factory-codes/list?productSku=${encodeURIComponent(sku)}`, market),
        { credentials: "include" },
      );
      if (!res.ok) return;
      const codes = (await res.json()) as FactoryCodeRecord[];
      const primary = codes.find((c) => c.isPrimary) ?? codes[0];
      if (primary) {
        setFormSupplierId(primary.supplierId);
        setFormSupplierFactoryCode(primary.factoryCode);
      }
    } catch (error) {
      console.error("Error loading factory code:", error);
    } finally {
      setLoadingFactoryCode(false);
    }
  }

  function openCreateDialog() {
    setEditingProduct(null);
    resetForm();
    setDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setFormName(product.name);
    setFormFamily(product.family);
    setFormPricingMode(product.pricingMode === "pvp" ? "pvp" : "neto");
    setFormFinishType(product.finishType ?? "");
    setFormFactoryCost(Number(product.factoryCost) || 0);
    setFormProfitMargin(Number(product.profitMargin) || 0);
    setFormPvpPrice(Number(product.pvpPrice) || 0);
    setFormUnit(product.unit);
    setFormStock(Number(product.stock) || 0);
    setFormDescription(product.description || "");
    setFormIsActive(product.isActive);
    void loadProductFactoryCode(product.sku);
    setDialogOpen(true);
  }

  function resetForm() {
    setFormName("");
    setFormFamily("");
    setFormSubfamily("");
    setFormPricingMode("neto");
    setFormFinishType("");
    setFormFactoryCost(0);
    setFormProfitMargin(40);
    setFormPvpPrice(0);
    setFormUnit("unidad");
    setFormStock(0);
    setFormDescription("");
    setFormIsActive(true);
    setFormSupplierId("");
    setFormSupplierFactoryCode("");
  }

  async function handleSaveProduct() {
    if (!formName || !formFamily) {
      showWarning("Por favor completa todos los campos requeridos");
      return;
    }
    if (formFamily === "REV" && !formFinishType) {
      showWarning("Revestimiento requiere Decorado o Pieza lisa");
      return;
    }
    if (formPricingMode === "neto" && formFactoryCost <= 0) {
      showWarning("Indica el costo de fábrica (neto)");
      return;
    }
    if (formPricingMode === "pvp" && formPvpPrice <= 0) {
      showWarning("Indica el PVP");
      return;
    }
    if (formProfitMargin < 0 || formProfitMargin > 100) {
      showWarning("Indica el margen de ganancia (0–100%)");
      return;
    }
    if (!formSupplierId || !formSupplierFactoryCode.trim()) {
      showWarning("Indica proveedor y código de fábrica (necesario para pedidos a proveedor)");
      return;
    }

    setSaving(true);

    try {
      const body = {
        name: formName,
        family: formFamily,
        supplierId: formSupplierId,
        factoryCode: formSupplierFactoryCode.trim(),
        pricingMode: formPricingMode,
        finishType: formFamily === "REV" ? formFinishType : null,
        factoryCost: formPricingMode === "neto" ? formFactoryCost : undefined,
        profitMargin: formProfitMargin,
        pvpPrice: formPricingMode === "pvp" ? formPvpPrice : undefined,
        unit: formUnit,
        stock: isSpainMarket ? 0 : formStock,
        description: formDescription || undefined,
        isActive: formIsActive,
        market,
      };

      const url = editingProduct
        ? `${API}/products/${editingProduct.id}`
        : `${API}/products`;

      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        showError(await readApiError(res, "Error al guardar el producto"));
        return;
      }

      setDialogOpen(false);
      showSuccess(editingProduct ? "Producto actualizado" : "Producto creado");
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      showError("Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  }

  async function handleWizardNext() {
    setSaving(true);
    try {
      if (wizardStep === 0) {
        const res = await fetch(`${API}/suppliers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...wizSupplier, market }),
        });
        if (!res.ok) {
          showError(await readApiError(res, "Error al crear proveedor"));
          return;
        }
        const data = await res.json();
        setWizSupplierId(data.id);
        setWizardStep(1);
      } else if (wizardStep === 1) {
        const famRes = await fetch(`${API}/products/families`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(wizFamily),
        });
        // Familia puede ya existir; si falla por duplicado, seguimos con el código indicado
        if (!famRes.ok && famRes.status !== 400) {
          showError(await readApiError(famRes, "Error al crear familia"));
          return;
        }
        setFormFamily(wizFamily.code);
        setWizardStep(2);
      } else if (wizardStep === 2) {
        if (!wizFactoryCode.trim()) {
          showError("Código de fábrica obligatorio");
          return;
        }
        const res = await fetch(`${API}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: formName,
            family: wizFamily.code,
            supplierId: wizSupplierId,
            factoryCode: wizFactoryCode.trim(),
            pricingMode: formPricingMode,
            finishType: wizFamily.code === "REV" ? formFinishType || undefined : undefined,
            factoryCost: formPricingMode === "neto" ? formFactoryCost : undefined,
            profitMargin: formProfitMargin,
            pvpPrice: formPricingMode === "pvp" ? formPvpPrice : undefined,
            unit: formUnit,
            stock: isSpainMarket ? 0 : formStock,
            description: formDescription,
            market,
          }),
        });
        if (!res.ok) {
          showError(await readApiError(res, "Error al crear producto"));
          return;
        }
        const product = await res.json();
        setCreatedSku(product.sku);
        setWizardStep(3);
        fetchData();
      } else {
        setWizardOpen(false);
        setWizardStep(0);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct() {
    if (!productToDelete) return;

    try {
      const res = await fetch(`${API}/products/${productToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setDeleteDialogOpen(false);
        setProductToDelete(null);
        showSuccess("Producto eliminado");
        fetchData();
      } else {
        showError("Error al eliminar el producto");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showError("Error al eliminar el producto");
    }
  }

  const filteredProducts = products.filter((p) => {
    if (showOnlyActive && !p.isActive) return false;
    if (filterFamily && p.family !== filterFamily) return false;
    if (filterSubfamily && p.subfamily !== filterSubfamily) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const calculatedPVP =
    formPricingMode === "pvp"
      ? formPvpPrice
      : formFactoryCost && formProfitMargin !== undefined
        ? formFactoryCost * (1 + formProfitMargin / 100)
        : 0;

  const calculatedFactoryCost =
    formPricingMode === "pvp" && formPvpPrice > 0
      ? formPvpPrice / (1 + formProfitMargin / 100)
      : formFactoryCost;

  const saveDisabled =
    saving ||
    !formName ||
    !formFamily ||
    (formFamily === "REV" && !formFinishType) ||
    (formPricingMode === "neto" && formFactoryCost <= 0) ||
    (formPricingMode === "pvp" && formPvpPrice <= 0) ||
    formProfitMargin < 0 ||
    formProfitMargin > 100 ||
    !formSupplierId ||
    !formSupplierFactoryCode.trim();

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Catálogo de Productos</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => { setWizardOpen(true); setWizardStep(0); }}>
            Asistente de alta
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
            Nuevo Producto
          </Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            label="Buscar por nombre o SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
          />
          <LabeledSelect
            label="Familia"
            value={filterFamily}
            emptyLabel="Todas"
            onChange={(e) => {
              setFilterFamily(String(e.target.value));
              setFilterSubfamily("");
            }}
            formControlProps={{ sx: { minWidth: 150 } }}
          >
            {families.map((f) => (
              <MenuItem key={f.code} value={f.code}>
                {f.name}
              </MenuItem>
            ))}
          </LabeledSelect>
          {filterFamily && (
            <LabeledSelect
              label="Proveedor"
              value={filterSubfamily}
              emptyLabel={loadingSubfamilies ? "Cargando…" : "Todos"}
              onChange={(e) => setFilterSubfamily(String(e.target.value))}
              formControlProps={{ sx: { minWidth: 150 } }}
            >
              {subfamilies
                .filter((sf) => sf.familyCode === filterFamily)
                .map((sf) => (
                  <MenuItem key={sf.code} value={sf.code}>
                    {sf.name}
                  </MenuItem>
                ))}
            </LabeledSelect>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
              />
            }
            label="Solo activos"
          />
        </Stack>
      </Paper>

      {loadError && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "error.light", color: "error.contrastText" }}>
          <Typography variant="body2">{loadError}</Typography>
        </Paper>
      )}

      {/* Products Table */}
      {loading ? (
        <Typography>Cargando...</Typography>
      ) : filteredProducts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            No hay productos que coincidan con los filtros
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Familia</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell align="right">PVP</TableCell>
                {!isSpainMarket && <TableCell align="right">Stock</TableCell>}
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.familyName}</TableCell>
                  <TableCell>{product.subfamilyName}</TableCell>
                  <TableCell align="right">${product.pvpPrice.toFixed(2)}</TableCell>
                  {!isSpainMarket && (
                    <TableCell align="right">{product.stock}</TableCell>
                  )}
                  <TableCell>
                    <Chip
                      label={product.isActive ? "Activo" : "Inactivo"}
                      color={product.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(product)}
                      color="primary"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setProductToDelete(product);
                        setDeleteDialogOpen(true);
                      }}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? "Editar Producto" : "Nuevo Producto"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              fullWidth
            />
            <LabeledSelect
              label="Familia"
              value={formFamily}
              emptyLabel="Seleccionar familia"
              required
              fullWidth
              formControlProps={{ fullWidth: true, required: true }}
              onChange={(e) => {
                const code = String(e.target.value);
                setFormFamily(code);
                setFormFinishType("");
              }}
            >
              {families.map((f) => (
                <MenuItem key={f.code} value={f.code}>
                  {f.name}
                </MenuItem>
              ))}
            </LabeledSelect>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Proveedor (= subfamilia automática para pedido a fábrica)
            </Typography>
            <LabeledSelect
              label="Proveedor"
              value={formSupplierId}
              emptyLabel={
                loadingFactoryCode ? "Cargando…" : "Seleccionar proveedor"
              }
              required
              fullWidth
              disabled={loadingFactoryCode}
              formControlProps={{ fullWidth: true, required: true }}
              onChange={(e) => setFormSupplierId(String(e.target.value))}
            >
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </LabeledSelect>
            <TextField
              label="Código de fábrica"
              value={formSupplierFactoryCode}
              onChange={(e) => setFormSupplierFactoryCode(e.target.value)}
              required
              fullWidth
              helperText="Referencia del proveedor. Agrupa este artículo en el pedido a ese proveedor."
            />
            <Divider sx={{ my: 1 }} />
            {formFamily === "REV" && (
              <LabeledSelect
                label="Tipo revestimiento"
                value={formFinishType}
                emptyLabel="Seleccionar"
                required
                fullWidth
                formControlProps={{ fullWidth: true, required: true }}
                onChange={(e) => setFormFinishType(String(e.target.value) as FinishType)}
              >
                <MenuItem value="decorado">Decorado</MenuItem>
                <MenuItem value="pieza_lisa">Pieza lisa</MenuItem>
              </LabeledSelect>
            )}
            <LabeledSelect
              label="Modo de precio"
              value={formPricingMode}
              fullWidth
              formControlProps={{ fullWidth: true }}
              onChange={(e) => setFormPricingMode(String(e.target.value) as PricingMode)}
            >
              <MenuItem value="neto">Neto (costo + margen → PVP)</MenuItem>
              <MenuItem value="pvp">PVP (precio venta + margen → costo)</MenuItem>
            </LabeledSelect>
            {formPricingMode === "neto" ? (
              <>
                <TextField
                  label="Costo / Neto"
                  type="number"
                  value={formFactoryCost}
                  onChange={(e) =>
                    setFormFactoryCost(parseFloat(e.target.value) || 0)
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="Margen de ganancia (%)"
                  type="number"
                  value={formProfitMargin}
                  onChange={(e) =>
                    setFormProfitMargin(parseFloat(e.target.value) || 0)
                  }
                  required
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                />
                <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
                  <Typography variant="body2" color="text.secondary">
                    PVP calculado: ${calculatedPVP.toFixed(2)}
                  </Typography>
                </Paper>
              </>
            ) : (
              <>
                <TextField
                  label="PVP"
                  type="number"
                  value={formPvpPrice}
                  onChange={(e) => setFormPvpPrice(parseFloat(e.target.value) || 0)}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <TextField
                  label="Margen de ganancia (%)"
                  type="number"
                  value={formProfitMargin}
                  onChange={(e) =>
                    setFormProfitMargin(parseFloat(e.target.value) || 0)
                  }
                  required
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                />
                <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
                  <Typography variant="body2" color="text.secondary">
                    Costo de compra calculado: ${calculatedFactoryCost.toFixed(2)}
                  </Typography>
                </Paper>
              </>
            )}

            <TextField
              label="Unidad"
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
              fullWidth
            />
            {!isSpainMarket && (
              <TextField
                label="Stock inicial"
                type="number"
                value={formStock}
                onChange={(e) =>
                  setFormStock(parseInt(e.target.value, 10) || 0)
                }
                fullWidth
                inputProps={{ min: 0 }}
              />
            )}
            <TextField
              label="Descripción"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                />
              }
              label="Producto activo"
            />
            {editingProduct && (
              <TextField
                label="SKU"
                value={editingProduct.sku}
                disabled
                fullWidth
                helperText="El SKU no puede ser modificado"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveProduct}
            disabled={saveDisabled}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el producto{" "}
            <strong>{productToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteProduct}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Asistente: {["Proveedor", "Familia", "Artículo + Código fábrica", "Completado"][wizardStep]}
        </DialogTitle>
        <DialogContent>
          {wizardStep === 0 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Nombre proveedor" value={wizSupplier.name} onChange={(e) => setWizSupplier({ ...wizSupplier, name: e.target.value })} fullWidth />
              <TextField label="Email" value={wizSupplier.email} onChange={(e) => setWizSupplier({ ...wizSupplier, email: e.target.value })} fullWidth />
              <Typography variant="caption" color="text.secondary">
                Este proveedor será la subfamilia del producto y agrupa el pedido a fábrica.
              </Typography>
            </Stack>
          )}
          {wizardStep === 1 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Código familia (3 letras)"
                value={wizFamily.code}
                onChange={(e) => setWizFamily({ ...wizFamily, code: e.target.value.toUpperCase().slice(0, 3) })}
                fullWidth
              />
              <TextField label="Nombre familia" value={wizFamily.name} onChange={(e) => setWizFamily({ ...wizFamily, name: e.target.value })} fullWidth />
              <Typography variant="caption" color="text.secondary">
                La subfamilia se crea sola desde el proveedor del paso anterior.
              </Typography>
            </Stack>
          )}
          {wizardStep === 2 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Nombre artículo" value={formName} onChange={(e) => setFormName(e.target.value)} fullWidth />
              <TextField label="Código fábrica" value={wizFactoryCode} onChange={(e) => setWizFactoryCode(e.target.value)} fullWidth />
              {wizFamily.code === "REV" && (
                <LabeledSelect
                  label="Tipo revestimiento"
                  value={formFinishType}
                  emptyLabel="Seleccionar"
                  fullWidth
                  formControlProps={{ fullWidth: true }}
                  onChange={(e) => setFormFinishType(String(e.target.value) as FinishType)}
                >
                  <MenuItem value="decorado">Decorado</MenuItem>
                  <MenuItem value="pieza_lisa">Pieza lisa</MenuItem>
                </LabeledSelect>
              )}
              <LabeledSelect
                label="Modo de precio"
                value={formPricingMode}
                fullWidth
                formControlProps={{ fullWidth: true }}
                onChange={(e) => setFormPricingMode(String(e.target.value) as PricingMode)}
              >
                <MenuItem value="neto">Neto (costo + margen → PVP)</MenuItem>
                <MenuItem value="pvp">PVP (precio venta + margen → costo)</MenuItem>
              </LabeledSelect>
              {formPricingMode === "neto" ? (
                <>
                  <TextField label="Coste / Neto" type="number" value={formFactoryCost} onChange={(e) => setFormFactoryCost(parseFloat(e.target.value) || 0)} fullWidth />
                  <TextField label="Margen %" type="number" value={formProfitMargin} onChange={(e) => setFormProfitMargin(parseFloat(e.target.value) || 0)} fullWidth inputProps={{ min: 0, max: 100 }} />
                  <Typography variant="body2" color="text.secondary">
                    PVP calculado: ${calculatedPVP.toFixed(2)}
                  </Typography>
                </>
              ) : (
                <>
                  <TextField label="PVP" type="number" value={formPvpPrice} onChange={(e) => setFormPvpPrice(parseFloat(e.target.value) || 0)} fullWidth />
                  <TextField label="Margen %" type="number" value={formProfitMargin} onChange={(e) => setFormProfitMargin(parseFloat(e.target.value) || 0)} fullWidth inputProps={{ min: 0, max: 100 }} />
                  <Typography variant="body2" color="text.secondary">
                    Costo de compra calculado: ${calculatedFactoryCost.toFixed(2)}
                  </Typography>
                </>
              )}
              {!isSpainMarket && (
                <TextField label="Stock" type="number" value={formStock} onChange={(e) => setFormStock(parseInt(e.target.value, 10) || 0)} fullWidth />
              )}
            </Stack>
          )}
          {wizardStep === 3 && (
            <Typography sx={{ mt: 2 }}>Artículo creado: <strong>{createdSku}</strong></Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWizardOpen(false)}>Cerrar</Button>
          <Button variant="contained" onClick={handleWizardNext} disabled={saving}>
            {wizardStep === 3 ? "Finalizar" : "Siguiente"}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarHost />
    </>
  );
}
