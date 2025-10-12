const API_BASE = import.meta?.env?.VITE_PYTHON_BASE || 'http://localhost:8000';


// CustomAlgo.js
import { useRef } from "react";
import { Button, Container } from "@mui/material";
import { http } from "../utils/auth"; // Adjust the import path as necessary

export default function CustomAlgoButton({ setNodes, nodes, edges, isLoading = false, setIsLoading = () => {}, notify = () => {} }) {
    const fileInputRef = useRef(null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];

        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("Vertices", JSON.stringify(nodes));
        formData.append("Edges", JSON.stringify(edges));

        setIsLoading(true);
        try {
            // replaced fetch with http.post
            const resp = await http.post('/api/run/', formData, {
                json: false,
                auth: true,
                apiBase: API_BASE,
            });

            const data = resp?.result;
            //console.log(data);

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
