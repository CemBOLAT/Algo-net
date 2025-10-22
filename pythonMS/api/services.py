import subprocess
import tempfile
import os
import json

class ScriptExecutionError(Exception):
    pass

def run_python_script(uploaded_file, vertices, edges):
    tmp_path = None
    try:
        # Save uploaded script to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".py") as tmp_file:
            for chunk in uploaded_file.chunks():
                tmp_file.write(chunk)
            tmp_path = tmp_file.name
        print("Deneme1\n")

        # Execute script with vertices/edges as arguments
        process = subprocess.Popen(
            ["python", tmp_path, json.dumps(vertices), json.dumps(edges)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        stdout, stderr = process.communicate()

        print("Deneme2\n", process.returncode, stdout, stderr)

        if process.returncode != 0:
            raise ScriptExecutionError(stderr or "Script returned non-zero exit code")
        
        print("stdout3")
        #print("stdout:", stdout)

        # Support optional "$$$" delimiter
        parts = stdout.split("$$$")
        print("stdout4")
        script_output = parts[1].strip() if len(parts) > 1 else stdout.strip()
        print(parts[0]) # Debugging line to print any output before the $$$ delimiter

        # Parse JSON result if possible
        try:
            return json.loads(script_output)
        except json.JSONDecodeError:
            return {"raw_output": script_output}
    finally:
        print("Deneme5\n")
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass

def run_fixed_python_script(script_path, vertices, edges, entries=None):
    """
    Execute a fixed Python script (not user-uploaded) with JSON arguments.
    Args passed to script: vertices_json edges_json [entries_json]
    Output parsing supports optional '$$$' delimiter and JSON body like run_python_script.
    """
    if not os.path.isfile(script_path):
        raise ScriptExecutionError(f"Script not found: {script_path}")

    args = ["python", script_path, json.dumps(vertices), json.dumps(edges)]
    if entries is not None:
        args.append(json.dumps(entries))

    process = subprocess.Popen(
        args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    stdout, stderr = process.communicate()

    if process.returncode != 0:
        raise ScriptExecutionError(stderr or "Script returned non-zero exit code")

    parts = stdout.split("$$$")
    script_output = parts[1].strip() if len(parts) > 1 else stdout.strip()
    print(parts[0]) # Debugging line to print any output before the $$$ delimiter

    try:
        return json.loads(script_output)
    except json.JSONDecodeError:
        # return raw output to allow callers to decide
        return {"raw_output": script_output}
