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
import { useCurrentUser, API } from "@/features/auth/hooks/useCurrentUser";
import { useAppSnackbar } from "@/shared/hooks/useAppSnackbar";
import { useAdminMarket } from "@/features/admin/context/AdminMarketContext";
import { adminApiUrl } from "@/features/admin/utils/adminApi";
import { readApiError } from "@/features/admin/utils/readApiError";
import { LabeledSelect } from "@/shared/components/LabeledSelect";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ConfirmDialog, PageToolbar, ResponsiveTable, TableEmptyRow, TableLoadingRow } from "@/shared/ui";

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
  piecesPerBox: number | null;
  unitPerPiece: number | null;
  stock: number;
  description: string | null;
  imageUrl: string | null;
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

interface SupplierOption {
  id: string;
  name: string;
  prefix: string | null;
  familyCodes?: string[];
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
    piecesPerBox:
      raw.piecesPerBox === null || raw.piecesPerBox === undefined
        ? null
        : Number(raw.piecesPerBox),
    unitPerPiece:
      raw.unitPerPiece === null || raw.unitPerPiece === undefined
        ? null
        : Number(raw.unitPerPiece),
  };
}

const MAX_PROFIT_MARGIN = 999;

function isM2Unit(unit: string): boolean {
  const normalized = unit
    .trim()
    .toLowerCase()
    .replace("²", "2")
    .replace(/\s+/g, "");
  return normalized === "m2";
}

export function AdminProductsPage() {
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
  const [formPiecesPerBox, setFormPiecesPerBox] = useState<number>(0);
  const [formUnitPerPiece, setFormUnitPerPiece] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const isSpainMarket = market === "ES";
  const [formSupplierId, setFormSupplierId] = useState("");
  const [loadingSupplier, setLoadingSupplier] = useState(false);
  const [familySuppliers, setFamilySuppliers] = useState<SupplierOption[]>([]);
  const [suppliersLinkedToFamily, setSuppliersLinkedToFamily] = useState(true);
  const [loadingFamilySuppliers, setLoadingFamilySuppliers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSubfamilies, setLoadingSubfamilies] = useState(false);

  // Wizard: Familia → Proveedor → Artículo
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [wizSupplier, setWizSupplier] = useState({
    name: "",
    email: "",
    prefix: "",
  });
  const [wizSupplierId, setWizSupplierId] = useState("");
  const [wizFamily, setWizFamily] = useState({ code: "", name: "" });
  const [createdSku, setCreatedSku] = useState("");

  useEffect(() => {
    void fetchData();
  }, [market]);

  useEffect(() => {
    if (filterFamily) {
      void fetchSubfamilies(filterFamily);
    }
  }, [filterFamily]);

  useEffect(() => {
    if (formFamily) {
      void fetchSuppliersForFamily(formFamily);
    } else {
      setFamilySuppliers([]);
      setSuppliersLinkedToFamily(true);
    }
  }, [formFamily, market]);

  useEffect(() => {
    if (!formSupplierId) return;
    setFamilySuppliers((prev) => {
      if (prev.some((s) => s.id === formSupplierId)) return prev;
      const fromAll = suppliers.find((s) => s.id === formSupplierId);
      return fromAll ? [...prev, fromAll] : prev;
    });
  }, [formSupplierId, suppliers]);

  async function fetchSuppliersForFamily(familyCode: string) {
    setLoadingFamilySuppliers(true);
    try {
      const [linkedRes, allRes] = await Promise.all([
        fetch(
          adminApiUrl(`/suppliers?familyCode=${encodeURIComponent(familyCode)}`, market),
          { credentials: "include" },
        ),
        fetch(adminApiUrl("/suppliers", market), { credentials: "include" }),
      ]);

      const all = allRes.ok ? ((await allRes.json()) as SupplierOption[]) : [];
      if (allRes.ok) setSuppliers(all);

      if (linkedRes.ok) {
        const linked = (await linkedRes.json()) as SupplierOption[];
        if (linked.length > 0) {
          setFamilySuppliers(linked);
          setSuppliersLinkedToFamily(true);
        } else {
          setFamilySuppliers(all);
          setSuppliersLinkedToFamily(false);
        }
        return;
      }
      setFamilySuppliers(all);
      setSuppliersLinkedToFamily(false);
    } catch {
      setFamilySuppliers([]);
    } finally {
      setLoadingFamilySuppliers(false);
    }
  }

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

  async function loadProductSupplier(sku: string) {
    setLoadingSupplier(true);
    setFormSupplierId("");
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
      }
    } catch (error) {
      console.error("Error loading product supplier:", error);
    } finally {
      setLoadingSupplier(false);
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
    setFormPiecesPerBox(Number(product.piecesPerBox) || 0);
    setFormUnitPerPiece(Number(product.unitPerPiece) || 0);
    setFormStock(Number(product.stock) || 0);
    setFormDescription(product.description || "");
    setFormIsActive(product.isActive);
    setFormImageUrl(product.imageUrl || "");
    setFormImageFile(null);
    void loadProductSupplier(product.sku);
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
    setFormPiecesPerBox(0);
    setFormUnitPerPiece(0);
    setFormStock(0);
    setFormDescription("");
    setFormIsActive(true);
    setFormImageUrl("");
    setFormImageFile(null);
    setFormSupplierId("");
  }

  async function uploadProductImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/uploads/products`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) {
      throw new Error(await readApiError(res, "Error al subir imagen"));
    }
    const data = (await res.json()) as { url: string };
    return data.url;
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
    if (formProfitMargin < 0 || formProfitMargin > MAX_PROFIT_MARGIN) {
      showWarning(`Indica el margen de ganancia (0–${MAX_PROFIT_MARGIN}%)`);
      return;
    }
    if (!formSupplierId) {
      showWarning("Indica el proveedor");
      return;
    }
    if (isM2Unit(formUnit) && (formPiecesPerBox < 1 || formUnitPerPiece <= 0)) {
      showWarning("Unidad m2: indica piezas por caja y cobertura por pieza");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = formImageUrl || undefined;
      if (formImageFile) {
        imageUrl = await uploadProductImage(formImageFile);
      }

      const body = {
        name: formName,
        family: formFamily,
        supplierId: formSupplierId,
        pricingMode: formPricingMode,
        finishType: formFamily === "REV" ? formFinishType : null,
        factoryCost: formPricingMode === "neto" ? formFactoryCost : undefined,
        profitMargin: formProfitMargin,
        pvpPrice: formPricingMode === "pvp" ? formPvpPrice : undefined,
        unit: formUnit,
        piecesPerBox: isM2Unit(formUnit) ? formPiecesPerBox : null,
        unitPerPiece: isM2Unit(formUnit) ? formUnitPerPiece : null,
        stock: isSpainMarket ? 0 : formStock,
        description: formDescription || undefined,
        imageUrl,
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
        // Familia (existing or create)
        if (wizFamily.code) {
          setFormFamily(wizFamily.code);
          setWizardStep(1);
          return;
        }
        if (!wizFamily.name.trim()) {
          showError("Nombre de familia obligatorio");
          return;
        }
        const famRes = await fetch(`${API}/products/families`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: wizFamily.name.trim() }),
        });
        if (!famRes.ok) {
          showError(await readApiError(famRes, "Error al crear familia"));
          return;
        }
        const fam = (await famRes.json()) as Family;
        setWizFamily({ code: fam.code, name: fam.name });
        setFormFamily(fam.code);
        setWizardStep(1);
      } else if (wizardStep === 1) {
        const prefix = wizSupplier.prefix.trim().toUpperCase();
        if (!wizSupplier.name.trim() || !wizSupplier.email.trim()) {
          showError("Proveedor: nombre y email obligatorios");
          return;
        }
        if (prefix && prefix.length !== 3) {
          showError("Prefijo SKU: 3 caracteres o vacío (auto)");
          return;
        }
        const familyCode = wizFamily.code || formFamily;
        if (!familyCode) {
          showError("Familia requerida");
          return;
        }
        const res = await fetch(`${API}/suppliers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: wizSupplier.name.trim(),
            email: wizSupplier.email.trim(),
            ...(prefix ? { prefix } : {}),
            familyCodes: [familyCode],
            market,
          }),
        });
        if (!res.ok) {
          showError(await readApiError(res, "Error al crear proveedor"));
          return;
        }
        const data = (await res.json()) as SupplierOption;
        setWizSupplierId(data.id);
        if (data.prefix) {
          setWizSupplier((prev) => ({ ...prev, prefix: data.prefix ?? prev.prefix }));
        }
        setWizardStep(2);
      } else if (wizardStep === 2) {
        if (!formName.trim()) {
          showError("Nombre del artículo obligatorio");
          return;
        }
        if (formProfitMargin < 0 || formProfitMargin > MAX_PROFIT_MARGIN) {
          showError(`Margen de ganancia inválido (0–${MAX_PROFIT_MARGIN}%)`);
          return;
        }
        if (isM2Unit(formUnit) && (formPiecesPerBox < 1 || formUnitPerPiece <= 0)) {
          showError("Unidad m2: indica piezas por caja y cobertura por pieza");
          return;
        }
        const familyCode = wizFamily.code || formFamily;
        const res = await fetch(`${API}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: formName,
            family: familyCode,
            supplierId: wizSupplierId,
            pricingMode: formPricingMode,
            finishType: familyCode === "REV" ? formFinishType || undefined : undefined,
            factoryCost: formPricingMode === "neto" ? formFactoryCost : undefined,
            profitMargin: formProfitMargin,
            pvpPrice: formPricingMode === "pvp" ? formPvpPrice : undefined,
            unit: formUnit,
            piecesPerBox: isM2Unit(formUnit) ? formPiecesPerBox : null,
            unitPerPiece: isM2Unit(formUnit) ? formUnitPerPiece : null,
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
        void fetchData();
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

  const supplierOptions =
    familySuppliers.length > 0 ? familySuppliers : suppliers;
  const selectedSupplier =
    supplierOptions.find((s) => s.id === formSupplierId) ??
    suppliers.find((s) => s.id === formSupplierId);
  const skuPreviewPrefix = selectedSupplier?.prefix?.toUpperCase() ?? null;
  const formIsM2 = isM2Unit(formUnit);
  const calculatedUnitPerBox =
    formIsM2 && formPiecesPerBox > 0 && formUnitPerPiece > 0
      ? formPiecesPerBox * formUnitPerPiece
      : 0;

  const saveDisabled =
    saving ||
    !formName.trim() ||
    !formFamily ||
    (formFamily === "REV" && !formFinishType) ||
    (formPricingMode === "neto" && formFactoryCost <= 0) ||
    (formPricingMode === "pvp" && formPvpPrice <= 0) ||
    formProfitMargin < 0 ||
    formProfitMargin > MAX_PROFIT_MARGIN ||
    !formSupplierId ||
    !selectedSupplier?.prefix ||
    (formIsM2 && (formPiecesPerBox < 1 || formUnitPerPiece <= 0));

  const saveDisabledHint = !formName.trim()
    ? "Falta Nombre"
    : formProfitMargin > MAX_PROFIT_MARGIN
      ? `Margen máximo ${MAX_PROFIT_MARGIN}%`
      : formIsM2 && (formPiecesPerBox < 1 || formUnitPerPiece <= 0)
        ? "m2: piezas/caja y cobertura/pieza"
        : null;

  return (
    <>
      <AdminPageHeader
        title="Catálogo de Productos"
        actions={
          <>
            <Button variant="outlined" onClick={() => { setWizardOpen(true); setWizardStep(0); }}>
              Asistente de alta
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
              Nuevo Producto
            </Button>
          </>
        }
      />

      <PageToolbar sx={{ mb: 2 }}>
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
      </PageToolbar>

      {loadError && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "error.light", color: "error.contrastText" }}>
          <Typography variant="body2">{loadError}</Typography>
        </Paper>
      )}

      <ResponsiveTable minWidth={800}>
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
          {loading ? (
            <TableLoadingRow colSpan={isSpainMarket ? 7 : 8} />
          ) : filteredProducts.length === 0 ? (
            <TableEmptyRow
              colSpan={isSpainMarket ? 7 : 8}
              message="No hay productos que coincidan con los filtros"
            />
          ) : (
            filteredProducts.map((product) => (
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
            ))
          )}
        </TableBody>
      </ResponsiveTable>

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
                setFormSupplierId("");
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
              Proveedor enlazado a la familia (prefijo → SKU y pedido a fábrica)
            </Typography>
            <LabeledSelect
              label="Proveedor"
              value={formSupplierId}
              emptyLabel={
                !formFamily
                  ? "Elige familia primero"
                  : loadingFamilySuppliers || loadingSupplier
                    ? "Cargando…"
                    : supplierOptions.length === 0
                      ? "No hay proveedores — créalos en Proveedores"
                      : "Seleccionar proveedor"
              }
              required
              fullWidth
              disabled={!formFamily || loadingFamilySuppliers || loadingSupplier}
              formControlProps={{ fullWidth: true, required: true }}
              onChange={(e) => setFormSupplierId(String(e.target.value))}
            >
              {supplierOptions.map((s) => (
                <MenuItem key={s.id} value={s.id} disabled={!s.prefix}>
                  {s.prefix ? `${s.prefix} — ${s.name}` : `${s.name} (sin prefijo)`}
                </MenuItem>
              ))}
            </LabeledSelect>
            {formFamily && !suppliersLinkedToFamily && supplierOptions.length > 0 && (
                <Typography variant="caption" color="warning.main">
                  Ningún proveedor enlazado a esta familia aún. Al guardar se enlaza el
                  elegido.
                </Typography>
              )}
            {formSupplierId && !selectedSupplier?.prefix && (
              <Typography variant="caption" color="error">
                Este proveedor no tiene prefijo SKU. Edítalo en Proveedores.
              </Typography>
            )}
            {!editingProduct && skuPreviewPrefix && (
              <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                SKU al guardar: {skuPreviewPrefix}-#####
              </Typography>
            )}
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
                  inputProps={{ min: 0, max: MAX_PROFIT_MARGIN }}
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
                  inputProps={{ min: 0, max: MAX_PROFIT_MARGIN }}
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
              helperText='Ej. "unidad", "m2"'
            />
            {formIsM2 && (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Empaque m²
                </Typography>
                <TextField
                  label="Piezas por caja"
                  type="number"
                  value={formPiecesPerBox || ""}
                  onChange={(e) =>
                    setFormPiecesPerBox(parseInt(e.target.value, 10) || 0)
                  }
                  required
                  fullWidth
                  inputProps={{ min: 1, step: 1 }}
                />
                <TextField
                  label="Cobertura por pieza (m²)"
                  type="number"
                  value={formUnitPerPiece || ""}
                  onChange={(e) =>
                    setFormUnitPerPiece(parseFloat(e.target.value) || 0)
                  }
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 0.0001 }}
                  helperText="Cuánto abarca una pieza en m²"
                />
                <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
                  <Typography variant="body2" color="text.secondary">
                    m² por caja:{" "}
                    {calculatedUnitPerBox > 0
                      ? calculatedUnitPerBox.toFixed(4)
                      : "—"}
                  </Typography>
                </Paper>
              </>
            )}
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
            <Button variant="outlined" component="label" fullWidth>
              {formImageFile
                ? formImageFile.name
                : formImageUrl
                  ? "Cambiar imagen"
                  : "Subir imagen"}
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setFormImageFile(file);
                }}
              />
            </Button>
            {(formImageFile || formImageUrl) && (
              <Box
                component="img"
                src={formImageFile ? URL.createObjectURL(formImageFile) : formImageUrl}
                alt="Vista previa"
                sx={{
                  width: "100%",
                  maxHeight: 180,
                  objectFit: "contain",
                  borderRadius: 1,
                  bgcolor: "action.hover",
                }}
              />
            )}
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
          <Stack alignItems="flex-end" spacing={0.5}>
            {saveDisabled && saveDisabledHint && (
              <Typography variant="caption" color="text.secondary" sx={{ pr: 1 }}>
                {saveDisabledHint}
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleSaveProduct}
              disabled={saveDisabled}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Confirmar eliminación"
        message={
          <Typography>
            ¿Estás seguro de que deseas eliminar el producto{" "}
            <strong>{productToDelete?.name}</strong>?
          </Typography>
        }
        confirmLabel="Eliminar"
        confirmColor="error"
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => void handleDeleteProduct()}
      />

      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Asistente: {["Familia", "Proveedor", "Artículo", "Completado"][wizardStep]}
        </DialogTitle>
        <DialogContent>
          {wizardStep === 0 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <LabeledSelect
                label="Familia existente"
                value={wizFamily.code}
                emptyLabel="Crear nueva…"
                fullWidth
                formControlProps={{ fullWidth: true }}
                onChange={(e) => {
                  const code = String(e.target.value);
                  const fam = families.find((f) => f.code === code);
                  setWizFamily({ code, name: fam?.name ?? "" });
                }}
              >
                {families.map((f) => (
                  <MenuItem key={f.code} value={f.code}>
                    {f.name}
                  </MenuItem>
                ))}
              </LabeledSelect>
              {!wizFamily.code && (
                <TextField
                  label="Nombre familia nueva"
                  value={wizFamily.name}
                  onChange={(e) => setWizFamily({ code: "", name: e.target.value })}
                  fullWidth
                  helperText="ID interno se genera solo. Prefijo SKU va en el proveedor."
                />
              )}
            </Stack>
          )}
          {wizardStep === 1 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nombre proveedor"
                value={wizSupplier.name}
                onChange={(e) => setWizSupplier({ ...wizSupplier, name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Email"
                value={wizSupplier.email}
                onChange={(e) => setWizSupplier({ ...wizSupplier, email: e.target.value })}
                fullWidth
              />
              <TextField
                label="Prefijo SKU (3)"
                value={wizSupplier.prefix}
                onChange={(e) =>
                  setWizSupplier({
                    ...wizSupplier,
                    prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3),
                  })
                }
                fullWidth
                helperText="Opcional. Si vacío, se genera desde el nombre."
                inputProps={{ maxLength: 3, style: { fontFamily: "monospace" } }}
              />
              <Typography variant="caption" color="text.secondary">
                Se enlaza a la familia del paso anterior. Pedidos a fábrica usan este proveedor.
              </Typography>
            </Stack>
          )}
          {wizardStep === 2 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                SKU: {wizSupplier.prefix.toUpperCase() || "???"}-#####
              </Typography>
              <TextField
                label="Nombre artículo"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                fullWidth
              />
              {(wizFamily.code || formFamily) === "REV" && (
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
                  <TextField label="Margen %" type="number" value={formProfitMargin} onChange={(e) => setFormProfitMargin(parseFloat(e.target.value) || 0)} fullWidth inputProps={{ min: 0, max: MAX_PROFIT_MARGIN }} />
                  <Typography variant="body2" color="text.secondary">
                    PVP calculado: ${calculatedPVP.toFixed(2)}
                  </Typography>
                </>
              ) : (
                <>
                  <TextField label="PVP" type="number" value={formPvpPrice} onChange={(e) => setFormPvpPrice(parseFloat(e.target.value) || 0)} fullWidth />
                  <TextField label="Margen %" type="number" value={formProfitMargin} onChange={(e) => setFormProfitMargin(parseFloat(e.target.value) || 0)} fullWidth inputProps={{ min: 0, max: MAX_PROFIT_MARGIN }} />
                  <Typography variant="body2" color="text.secondary">
                    Costo de compra calculado: ${calculatedFactoryCost.toFixed(2)}
                  </Typography>
                </>
              )}
              <TextField
                label="Unidad"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                fullWidth
                helperText='Ej. "unidad", "m2"'
              />
              {formIsM2 && (
                <>
                  <TextField
                    label="Piezas por caja"
                    type="number"
                    value={formPiecesPerBox || ""}
                    onChange={(e) =>
                      setFormPiecesPerBox(parseInt(e.target.value, 10) || 0)
                    }
                    required
                    fullWidth
                    inputProps={{ min: 1, step: 1 }}
                  />
                  <TextField
                    label="Cobertura por pieza (m²)"
                    type="number"
                    value={formUnitPerPiece || ""}
                    onChange={(e) =>
                      setFormUnitPerPiece(parseFloat(e.target.value) || 0)
                    }
                    required
                    fullWidth
                    inputProps={{ min: 0, step: 0.0001 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    m² por caja:{" "}
                    {calculatedUnitPerBox > 0
                      ? calculatedUnitPerBox.toFixed(4)
                      : "—"}
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
          <Button variant="contained" onClick={() => void handleWizardNext()} disabled={saving}>
            {wizardStep === 3 ? "Finalizar" : "Siguiente"}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackbarHost />
    </>
  );
}
