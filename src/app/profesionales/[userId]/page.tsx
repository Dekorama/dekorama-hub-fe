"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  ImageList,
  ImageListItem,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from "@mui/material";
import { Verified, ShoppingCart } from "@mui/icons-material";
import { useCurrentUser, API } from "../../hooks/useCurrentUser";
import { useAppSnackbar } from "../../hooks/useAppSnackbar";
import { usePageTitle } from "../../components/PageTitleContext";

interface PortfolioProject {
  id: string;
  title: string;
  description: string | null;
  completionDate: string;
  images: string[];
  tags: ProductTag[];
}

interface ProductTag {
  id: string;
  imageUrl: string;
  positionX: number;
  positionY: number;
  product: {
    sku: string;
    name: string;
    pvpPrice: number;
    familyName: string;
    subfamilyName: string;
  };
}

interface ProfessionalUser {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  profileData: { bio?: string; specialties?: string[] } | null;
}

export default function ProfessionalProfilePage() {
  const { userId } = useParams();
  const { user, loading: authLoading } = useCurrentUser(false);

  const [professional, setProfessional] = useState<ProfessionalUser | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<ProductTag["product"] | null>(null);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const { showSuccess, showError, SnackbarHost } = useAppSnackbar();

  usePageTitle(professional ? `Perfil: ${professional.name}` : "Perfil Profesional");

  useEffect(() => {
    if (!userId) return;

    Promise.all([
      fetch(`${API}/auth/users/${userId}`, { credentials: "include" }),
      fetch(`${API}/professional-documents/portfolio/${userId}`, {
        credentials: "include",
      }),
    ])
      .then(async ([userRes, portfolioRes]) => {
        if (!userRes.ok) throw new Error("Profesional no encontrado");
        const userData = await userRes.json();
        const portfolioData = portfolioRes.ok ? await portfolioRes.json() : [];

        setProfessional(userData);
        setPortfolio(portfolioData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    setAddingToCart(true);
    try {
      const res = await fetch(`${API}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productSku: selectedProduct.sku,
          quantity: cartQuantity,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al agregar al carrito");
      }

      setSelectedProduct(null);
      setCartQuantity(1);
      showSuccess("Producto agregado al carrito");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Error al agregar al carrito");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || authLoading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !professional) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error || "Profesional no encontrado"}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {/* Professional Header */}
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main" }}>
              {professional.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="h4">{professional.name}</Typography>
                {professional.isVerified && (
                  <Tooltip title="Profesional Verificado">
                    <Verified color="primary" />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {professional.email}
              </Typography>
              {professional.profileData?.specialties && (
                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  {professional.profileData.specialties.map((spec) => (
                    <Chip key={spec} label={spec} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
          {professional.profileData?.bio && (
            <Typography variant="body1" sx={{ mt: 2 }}>
              {professional.profileData.bio}
            </Typography>
          )}
        </Paper>

        {/* Portfolio Gallery */}
        <Typography variant="h5" gutterBottom>
          Portafolio de Proyectos
        </Typography>

        {portfolio.length === 0 ? (
          <Alert severity="info">Este profesional aún no ha publicado proyectos en su portafolio.</Alert>
        ) : (
          <Box>
            {portfolio.map((project) => (
              <Paper key={project.id} elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {project.title}
                </Typography>
                {project.description && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {project.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Finalizado: {new Date(project.completionDate).toLocaleDateString()}
                </Typography>

                <ImageList cols={3} gap={16} sx={{ mt: 2 }}>
                  {project.images.map((imageUrl) => {
                    const imageTags = project.tags.filter((tag) => tag.imageUrl === imageUrl);
                    return (
                      <ImageListItem key={imageUrl} sx={{ position: "relative" }}>
                        <img
                          src={imageUrl}
                          alt={project.title}
                          loading="lazy"
                          style={{ width: "100%", height: "300px", objectFit: "cover", borderRadius: 8 }}
                        />
                        {/* Product Tags as Pins */}
                        {imageTags.map((tag, index) => (
                          <Tooltip
                            key={tag.id}
                            title={`${tag.product.name} - $${tag.product.pvpPrice}`}
                          >
                            <Box
                              onClick={() => setSelectedProduct(tag.product)}
                              sx={{
                                position: "absolute",
                                left: `${tag.positionX}%`,
                                top: `${tag.positionY}%`,
                                width: 32,
                                height: 32,
                                bgcolor: "primary.main",
                                color: "white",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                cursor: "pointer",
                                transform: "translate(-50%, -50%)",
                                boxShadow: 2,
                                "&:hover": {
                                  bgcolor: "primary.dark",
                                  transform: "translate(-50%, -50%) scale(1.2)",
                                },
                                transition: "all 0.2s",
                              }}
                            >
                              {index + 1}
                            </Box>
                          </Tooltip>
                        ))}
                      </ImageListItem>
                    );
                  })}
                </ImageList>
              </Paper>
            ))}
          </Box>
        )}

        {/* Product Modal */}
        <Dialog open={!!selectedProduct} onClose={() => setSelectedProduct(null)}>
          <DialogTitle>
            <ShoppingCart sx={{ verticalAlign: "middle", mr: 1 }} />
            {selectedProduct?.name}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              SKU: {selectedProduct?.sku}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Familia:</strong> {selectedProduct?.familyName}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Subfamilia:</strong> {selectedProduct?.subfamilyName}
            </Typography>
            <Typography variant="h5" color="primary" sx={{ mt: 2, mb: 2 }}>
              ${selectedProduct?.pvpPrice}
            </Typography>
            <TextField
              type="number"
              label="Cantidad"
              value={cartQuantity}
              onChange={(e) => setCartQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1 }}
              fullWidth
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedProduct(null)} disabled={addingToCart}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddToCart}
              variant="contained"
              disabled={addingToCart}
              startIcon={<ShoppingCart />}
            >
              {addingToCart ? "Agregando..." : "Agregar al Carrito"}
            </Button>
          </DialogActions>
        </Dialog>
        <SnackbarHost />
      </Container>
  );
}
