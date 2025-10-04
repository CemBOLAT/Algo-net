const API_BASE = import.meta?.env?.VITE_PYTHON_BASE || '';


// CustomAlgo.js
import { useRef } from "react";
import { Button } from "@mui/material";

export default function CustomAlgoButton({ setNodes , nodes ,edges}) {
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("Vertices", JSON.stringify(nodes));
    formData.append("Edges", JSON.stringify(edges));

    try {
      const response = await fetch("http://localhost:55555/api/run/", {
        method: "POST",
        body: formData,
      });

      // Always check if response.ok
      if (!response.ok) {
        console.error("Backend returned error:", response.status);
        return;
      }



      // Parse JSON safely
      const data = (await response.json()).result;
      
      console.log(data)

      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          color: data[node.id] || node.color, // update if exists
        }))
      );

      

      event.target.value = null;
    } catch (err) {
      console.error("Fetch failed:", err);
      event.target.value = null;
    }
    

    
  };

  const onCustom = () => {
    console.log("Custom Algo Runned: ", fileInputRef);
    fileInputRef.current?.click();
  };

  return (
    <div>
      <Button
        id="custom-btn"
        variant="contained"
        color="inherit"
        fullWidth
        onClick={onCustom}
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
    </div>
  );
}
