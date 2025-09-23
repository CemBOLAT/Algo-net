let fileInputRef = null; // will be assigned when component renders

const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/customAlgo", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  console.log("Colors from Python:", data);

  // TODO: update your graph rendering here
};

export default function onCustom() {
  console.log("Custom Algo Runned");

  if (fileInputRef) {
    fileInputRef.click(); // open file explorer
  }
}

// Component that must be rendered somewhere in your app
export function CustomFileInput() {
  return (
    <input
      type="file"
      accept=".py"
      style={{ display: "none" }}
      ref={(input) => (fileInputRef = input)}
      onChange={handleFileSelect}
    />
  );
}
