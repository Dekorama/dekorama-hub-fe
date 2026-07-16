"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useCurrentUser, API } from "../../hooks/useCurrentUser";
import { AppShell } from "../../components/AppShell";

interface Product {
  id: string;
  sku: string;
  name: string;
  family: string;
  familyName: string;
  subfamily: string;
  subfamilyName: string;
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

interface Subfamily {
  code: string;
  familyCode: string;
  name: string;
  description: string | null;
}

export default function ProductosAdminPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [subfamilies, setSubfamilies] = useState<Subfamily[]>([]);
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
  const [formFactoryCost, setFormFactoryCost] = useState<number>(0);
  const [formProfitMargin, setFormProfitMargin] = useState<number>(40);
  const [formUnit, setFormUnit] = useState("unidad");
  const [formStock, setFormStock] = useState<number>(0);
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (filterFamily) {
      fetchSubfamilies(filterFamily);
    }
  }, [filterFamily]);

  async function fetchData() {
    setLoading(true);
    try {
      const [productsRes, familiesRes] = await Promise.all([
        fetch(`${API}/products`, { credentials: "include" }),
        fetch(`${API}/products/families/all`, { credentials: "include" }),
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data);
      }
      
      if (familiesRes.ok) {
        const data = await familiesRes.json();
        setFamilies(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubfamilies(familyCode: string) {
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
    setFormSubfamily(product.subfamily);
    setFormFactoryCost(product.factoryCost);
    setFormProfitMargin(product.profitMargin);
    setFormUnit(product.unit);
    setFormStock(product.stock);
    setFormDescription(product.description || "");
    setFormIsActive(product.isActive);
    fetchSubfamilies(product.family);
    setDialogOpen(true);
  }

  function resetForm() {
    setFormName("");
    setFormFamily("");
    setFormSubfamily("");
    setFormFactoryCost(0);
    setFormProfitMargin(40);
    setFormUnit("unidad");
    setFormStock(0);
    setFormDescription("");
    setFormIsActive(true);
  }

  async function handleSaveProduct() {
    if (!formName || !formFamily || !formSubfamily || formFactoryCost <= 0) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: formName,
        family: formFamily,
        subfamily: formSubfamily,
        factoryCost: formFactoryCost,
        profitMargin: formProfitMargin,
        unit: formUnit,
        stock: formStock,
        description: formDescription || undefined,
        isActive: formIsActive,
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

      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      } else {
        alert("Error al guardar el producto");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error al guardar el producto");
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
        fetchData();
      } else {
        alert("Error al eliminar el producto");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error al eliminar el producto");
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
    formFactoryCost && formProfitMargin !== undefined
      ? formFactoryCost * (1 + formProfitMargin / 100)
      : 0;

  const availableSubfamilies = subfamilies.filter(
    (sf) => sf.familyCode === formFamily
  );

  if (userLoading) {
    return (
      <AppShell title="Productos" user={user}>
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell title="Productos" user={user}>
      <Box sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Catálogo de Productos</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
          Nuevo Producto
        </Button>
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
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Familia</InputLabel>
            <Select
              value={filterFamily}
              label="Familia"
              onChange={(e) => {
                setFilterFamily(e.target.value);
                setFilterSubfamily("");
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              {families.map((f) => (
                <MenuItem key={f.code} value={f.code}>
                  {f.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {filterFamily && (
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Subfamilia</InputLabel>
              <Select
                value={filterSubfamily}
                label="Subfamilia"
                onChange={(e) => setFilterSubfamily(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {subfamilies
                  .filter((sf) => sf.familyCode === filterFamily)
                  .map((sf) => (
                    <MenuItem key={sf.code} value={sf.code}>
                      {sf.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
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
                <TableCell>Subfamilia</TableCell>
                <TableCell align="right">PVP</TableCell>
                <TableCell align="right">Stock</TableCell>
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
                  <TableCell align="right">{product.stock}</TableCell>
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
            <FormControl fullWidth required>
              <InputLabel>Familia</InputLabel>
              <Select
                value={formFamily}
                label="Familia"
                onChange={(e) => {
                  setFormFamily(e.target.value);
                  setFormSubfamily("");
                  fetchSubfamilies(e.target.value);
                }}
              >
                {families.map((f) => (
                  <MenuItem key={f.code} value={f.code}>
                    {f.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required disabled={!formFamily}>
              <InputLabel>Subfamilia</InputLabel>
              <Select
                value={formSubfamily}
                label="Subfamilia"
                onChange={(e) => setFormSubfamily(e.target.value)}
              >
                {availableSubfamilies.map((sf) => (
                  <MenuItem key={sf.code} value={sf.code}>
                    {sf.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Costo de fábrica"
              type="number"
              value={formFactoryCost}
              onChange={(e) => setFormFactoryCost(parseFloat(e.target.value))}
              required
              fullWidth
            />
            <TextField
              label="Margen de ganancia (%)"
              type="number"
              value={formProfitMargin}
              onChange={(e) => setFormProfitMargin(parseFloat(e.target.value))}
              required
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />
            <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
              <Typography variant="body2" color="text.secondary">
                PVP calculado: ${calculatedPVP.toFixed(2)}
              </Typography>
            </Paper>
            <TextField
              label="Unidad"
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
              fullWidth
            />
            <TextField
              label="Stock inicial"
              type="number"
              value={formStock}
              onChange={(e) => setFormStock(parseInt(e.target.value))}
              fullWidth
              inputProps={{ min: 0 }}
            />
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
            disabled={
              saving ||
              !formName ||
              !formFamily ||
              !formSubfamily ||
              formFactoryCost <= 0
            }
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
    </Box>
    </AppShell>
  );
}
