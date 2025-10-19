const API_BASE = import.meta?.env?.VITE_PYTHON_BASE || 'http://localhost:8000';


// CustomAlgo.js
import { useRef } from "react";
import { Button, Container } from "@mui/material";
import { http, getTokens } from "../utils/auth"; // Adjust the import path as necessary

export default function CustomAlgoButton({ setNodes, nodes, edges, isLoading = false, setIsLoading = () => {}, notify = () => {}, graphName = 'Graph' }) {
    const fileInputRef = useRef(null);

    const getUserEmail = () => {
        try {
            const { accessToken } = getTokens() || {};
            const payload = JSON.parse(atob((accessToken || '').split('.')[1] || ''));
            return payload?.email || '';
        } catch { return ''; }
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("Vertices", JSON.stringify(nodes));
        formData.append("Edges", JSON.stringify(edges));

        const notifyEnabled = localStorage.getItem('notifications_enabled') === 'true';
        if (notifyEnabled) {
            formData.append("shouldNotify", "true");
            formData.append("saveGraph", "true");
            formData.append("graphName", graphName || 'Graph');
            const email = getUserEmail();
            if (email) formData.append("userEmail", email);

            http.post('/api/run/', formData, { json: false, auth: true, apiBase: API_BASE })
              .catch((err) => console.error('custom algo async error:', err));
            notify('success', 'Algoritmanız çalıştığında cevap maili alacaksınız.', 2500);
            event.target.value = null;
            return;
        }

        setIsLoading(true);
        try {
            const resp = await http.post('/api/run/', formData, {
                json: false,
                auth: true,
                apiBase: API_BASE,
            });

            const data = resp?.result;
            setNodes((prevNodes) =>
                prevNodes.map((node) => ({
                    ...node,
                    color: data?.[node.id] ?? node.color,
                }))
            );
            event.target.value = null;
        } catch (err) {
            console.error("Request failed:", err);
            const msg = err?.data?.message || err?.message || 'Özel algoritma isteği başarısız oldu.';
            notify('error', msg, 2000);
        } finally {
            event.target.value = null;
            setIsLoading(false);
        }
    };

    const onCustom = () => {
        if (isLoading) return;
        fileInputRef.current?.click();
    };

    return (
        <Container style={{ padding: "0", marginTop: "10px" }}>
            <Button
                id="custom-btn"
                variant="contained"
                color="inherit"
                fullWidth
                onClick={onCustom}
                disabled={isLoading}
            >
                Custom
            </Button>

            <input 
                type="file"
                accept=".py,.ipynb"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileSelect}
            />
        </Container>
    );
}
