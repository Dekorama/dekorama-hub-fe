"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCurrentUser, API } from "../../hooks/useCurrentUser";
import {
  getProposalStatusColor,
  getProposalStatusLabel,
} from "../../utils/proposalLabels";

interface Material {
  productSku: string;
  productName: string;
  quantity: number;
  suggestedPrice: number;
}

interface Proposal {
  id: string;
  status: string;
  laborCost: number;
  message: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author?: { name: string };
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (data.message) return data.message;
  } catch {
    // ignore
  }
  return fallback;
}

export default function SolicitudDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useCurrentUser();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (user && id) {
      fetch(`${API}/proposals/${id}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then(setProposal);
      fetch(`${API}/proposals/${id}/materials`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then(setMaterials);
      fetch(`${API}/proposals/${id}/comments`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then(setComments);
    }
  }, [user, id]);

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const res = await fetch(`${API}/proposals/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newComment, visibility: "client" }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo enviar el comentario"));
      }
      setNewComment("");
      const cRes = await fetch(`${API}/proposals/${id}/comments`, { credentials: "include" });
      if (cRes.ok) setComments(await cRes.json());
    } catch (err: unknown) {
      setFeedback({
        open: true,
        message: err instanceof Error ? err.message : "Error al comentar",
        severity: "error",
      });
    } finally {
      setCommenting(false);
    }
  }

  async function handleSign() {
    setSigning(true);
    try {
      const res = await fetch(`${API}/proposals/${id}/sign`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "No se pudo firmar la proforma"));
      }
      const updated = (await res.json()) as Proposal;
      setProposal(updated);
      setFeedback({ open: true, message: "Proforma firmada correctamente", severity: "success" });
    } catch (err: unknown) {
      setFeedback({
        open: true,
        message: err instanceof Error ? err.message : "Error al firmar",
        severity: "error",
      });
    } finally {
      setSigning(false);
    }
  }

  async function handleDownloadPdf() {
    setDownloading(true);
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
    } catch (err: unknown) {
      setFeedback({
        open: true,
        message: err instanceof Error ? err.message : "Error al descargar PDF",
        severity: "error",
      });
    } finally {
      setDownloading(false);
    }
  }

  if (loading || !proposal) return null;

  const total =
    materials.reduce((s, m) => s + m.quantity * Number(m.suggestedPrice), 0) +
    Number(proposal.laborCost);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5">Detalle de solicitud</Typography>
        <Chip
          label={getProposalStatusLabel(proposal.status)}
          size="small"
          color={getProposalStatusColor(proposal.status)}
        />
      </Stack>

      {proposal.status === "proforma_ready" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Dekorama preparó tu proforma. Revísala y firma para confirmar la compra.
        </Alert>
      )}

      {proposal.status === "signed" && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Proforma firmada. Dekorama procesará tu pedido.
        </Alert>
      )}

      {proposal.message && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {proposal.message}
        </Typography>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Cant.</TableCell>
              <TableCell align="right">Precio</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map((m) => (
              <TableRow key={m.productSku}>
                <TableCell>{m.productName}</TableCell>
                <TableCell>{m.productSku}</TableCell>
                <TableCell>{m.quantity}</TableCell>
                <TableCell align="right">${Number(m.suggestedPrice).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography sx={{ mt: 2, fontWeight: "bold" }} align="right">
          Total: ${total.toFixed(2)}
        </Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Comentarios
        </Typography>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {comments.map((c) => (
            <Box key={c.id} sx={{ borderLeft: 3, borderColor: "divider", pl: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {c.author?.name ?? "Usuario"} · {new Date(c.createdAt).toLocaleString("es-ES")}
              </Typography>
              <Typography variant="body2">{c.content}</Typography>
            </Box>
          ))}
          {comments.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Aún no hay comentarios
            </Typography>
          )}
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            placeholder="Escribe un comentario…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={!newComment.trim() || commenting}
          >
            {commenting ? <CircularProgress size={18} color="inherit" /> : "Enviar"}
          </Button>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1}>
        {proposal.status === "proforma_ready" && (
          <Button
            variant="contained"
            onClick={handleSign}
            disabled={signing}
            startIcon={signing ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {signing ? "Firmando..." : "Firmar proforma"}
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={handleDownloadPdf}
          disabled={downloading}
          startIcon={downloading ? <CircularProgress size={16} /> : undefined}
        >
          {downloading ? "Descargando..." : "Descargar PDF"}
        </Button>
      </Stack>

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
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
