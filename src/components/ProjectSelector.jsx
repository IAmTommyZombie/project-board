import { useState } from "react";
import { ref, push } from "firebase/database";
import { db } from "../firebase";

function ProjectSelector({
  projects,
  selectedProject,
  onSelectProject,
  onCreateProject,
}) {
  const [newProjectName, setNewProjectName] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName) {
      setError("Project name cannot be empty.");
      return;
    }

    setError("");
    setIsCreating(true);
    const projectId = newProjectName.toLowerCase().replace(/\s+/g, "-");
    const projectsRef = ref(db, "projects");
    push(projectsRef, {
      [projectId]: {
        "to-do": { tasks: {} },
        "in-progress": { tasks: {} },
        done: { tasks: {} },
      },
    })
      .then(() => {
        onCreateProject(projectId);
        setNewProjectName("");
        setIsCreating(false);
      })
      .catch((error) => {
        console.error("Error creating project:", error);
        setError("Failed to create project: " + error.message);
        setIsCreating(false);
      });
  };

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 sm:text-xl">
        Projects
      </h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-3">
        <select
          value={selectedProject || ""}
          onChange={(e) => onSelectProject(e.target.value)}
          className="p-3 border rounded-lg w-full sm:w-1/2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
        >
          <option value="">Select a project</option>
          {Object.keys(projects || {}).map((projectId) => (
            <option key={projectId} value={projectId}>
              {projectId}
            </option>
          ))}
        </select>
        <form
          onSubmit={handleCreateProject}
          className="flex flex-col sm:flex-row gap-2 w-full sm:w-1/2"
        >
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project name"
            className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          />
          <button
            type="submit"
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-gray-400 w-full sm:w-auto text-sm sm:text-base"
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
      {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
    </div>
  );
}

export default ProjectSelector;
