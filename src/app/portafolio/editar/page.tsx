"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Checkbox,
  FormControlLabel,
  Alert,
  Box,
  Chip,
} from "@mui/material";
import { AddPhotoAlternate } from "@mui/icons-material";
import { AppShell } from "../../components/AppShell";
import { useCurrentUser, API } from "../../hooks/useCurrentUser";
import { MOCK_PORTFOLIO_IMAGES, MOCK_IMAGE_LABELS } from "../../utils/mockImages";

export default function PortfolioEditorPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <div>Cargando...</div>;
  if (!user) return null;

  if (user.role !== "professional") {
    return (
      <AppShell title="Portafolio" user={user}>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error">
            Solo los profesionales pueden crear portafolios
          </Alert>
        </Container>
      </AppShell>
    );
  }

  if (!user.isVerified) {
    return (
      <AppShell title="Portafolio" user={user}>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="warning">
            Debes estar verificado para crear portafolios. Por favor, sube tus
            documentos profesionales en el panel de administración.
          </Alert>
        </Container>
      </AppShell>
    );
  }

  const handleImageToggle = (imageUrl: string) => {
    if (selectedImages.includes(imageUrl)) {
      setSelectedImages(selectedImages.filter((url) => url !== imageUrl));
    } else {
      if (selectedImages.length >= 10) {
        setError("Máximo 10 imágenes por proyecto");
        return;
      }
      setSelectedImages([...selectedImages, imageUrl]);
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || !completionDate || selectedImages.length === 0) {
      setError("Por favor, completa todos los campos requeridos");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API}/professional-documents/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description: description || undefined,
          completionDate,
          images: selectedImages,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear portafolio");
      }

      // Redirect to professional profile or portfolio list
      router.push(`/profesionales/${user.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear portafolio");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Crear Proyecto de Portafolio" user={user}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Nuevo Proyecto de Portafolio
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            🎨 <strong>Nota:</strong> En esta versión usamos imágenes de demostración.
            La funcionalidad de subida de archivos estará disponible próximamente.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Título del Proyecto"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 200 }}
            />

            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="date"
              label="Fecha de Finalización"
              required
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              sx={{ mb: 3 }}
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                <AddPhotoAlternate sx={{ verticalAlign: "middle", mr: 1 }} />
                Selecciona Imágenes (1-10)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedImages.length} imagen(es) seleccionada(s)
              </Typography>

              <Grid container spacing={2}>
                {MOCK_PORTFOLIO_IMAGES.map((imageUrl, index) => {
                  const isSelected = selectedImages.includes(imageUrl);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={imageUrl}>
                      <Card
                        sx={{
                          cursor: "pointer",
                          border: isSelected ? "3px solid #1976d2" : "1px solid #ddd",
                          position: "relative",
                        }}
                        onClick={() => handleImageToggle(imageUrl)}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={imageUrl}
                          alt={MOCK_IMAGE_LABELS[index]}
                        />
                        <CardContent sx={{ p: 1 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isSelected}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleImageToggle(imageUrl)}
                              />
                            }
                            label={
                              <Typography variant="caption">
                                {MOCK_IMAGE_LABELS[index]}
                              </Typography>
                            }
                          />
                          {isSelected && (
                            <Chip
                              label={`#${selectedImages.indexOf(imageUrl) + 1}`}
                              color="primary"
                              size="small"
                              sx={{ position: "absolute", top: 8, right: 8 }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || selectedImages.length === 0}
              >
                {submitting ? "Guardando..." : "Guardar Proyecto"}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </AppShell>
  );
}
