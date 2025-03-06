import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { ref, onValue, update } from "firebase/database";
import { signOut } from "firebase/auth";
import ProjectColumn from "./ProjectColumn";
import TeamManagement from "./TeamManagement";
import ProjectSelector from "./ProjectSelector";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { useNavigate } from "react-router-dom";

// Simple mobile detection (can be improved with react-device-detect)
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function Dashboard() {
  const [user, loading, error] = useAuthState(auth);
  const [projects, setProjects] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const projectsRef = ref(db, "projects");
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Raw Firebase projects data:", data);
      console.log(
        `Selected project data for '${selectedProject}':`,
        data?.[selectedProject]
      );

      // Transform Firebase data to match expected structure: { "to-do": { tasks: {} }, ... }
      const transformedProjects = {};
      if (data) {
        Object.entries(data).forEach(([projectId, projectData]) => {
          transformedProjects[projectId] = {
            "to-do": { tasks: projectData?.tasks?.["to-do"] || {} },
            "in-progress": { tasks: projectData?.tasks?.["in-progress"] || {} },
            done: { tasks: projectData?.tasks?.["done"] || {} },
          };
          console.log(
            `Transformed project ${projectId} data:`,
            transformedProjects[projectId]
          );
        });
      }
      setProjects(transformedProjects || {});
      if (!selectedProject && transformedProjects) {
        const firstProjectId = Object.keys(transformedProjects)[0] || "default";
        setSelectedProject(firstProjectId);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [user, selectedProject]);

  const moveTask = (taskId, sourceId, destinationId) => {
    if (!selectedProject) return;
    console.log(
      "Moving task:",
      taskId,
      "from",
      sourceId,
      "to",
      destinationId,
      "in project",
      selectedProject
    );

    // Safely handle undefined tasks with the transformed structure
    const sourceTasks = projects[selectedProject]?.[sourceId]?.tasks || {};
    console.log(
      `Source tasks for ${sourceId} in ${selectedProject} before move:`,
      sourceTasks
    );
    const task = sourceTasks[taskId];
    if (!task) {
      console.error(
        "Task not found in source column:",
        sourceId,
        "for project:",
        selectedProject,
        "Tasks:",
        sourceTasks
      );
      return;
    }

    delete sourceTasks[taskId];

    const updates = {};
    updates[`projects/${selectedProject}/tasks/${sourceId}`] = sourceTasks;
    updates[`projects/${selectedProject}/tasks/${destinationId}/${taskId}`] = {
      ...task,
      status: destinationId,
    };
    console.log("Firebase updates for move:", updates);
    update(ref(db), updates)
      .then(() => console.log("Task moved successfully in Firebase"))
      .catch((error) => console.error("Error moving task in Firebase:", error));
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="p-6">Authenticating...</div>;
  if (error)
    return <div className="p-6 text-red-600">Error: {error.message}</div>;
  if (!user) return <div className="p-6">Please log in.</div>;

  return (
    <DndProvider
      backend={isMobile ? TouchBackend : HTML5Backend}
      options={{ enableTouchEvents: isMobile }}
    >
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Project Board</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user.email}</span>
            <button
              onClick={handleLogout}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </header>

        <main className="container mx-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-indigo-600 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"></div>
            </div>
          ) : (
            <>
              <ProjectSelector
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                onCreateProject={(newProjectId) =>
                  setSelectedProject(newProjectId)
                }
              />
              {selectedProject && (
                <>
                  <TeamManagement projectId={selectedProject} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {["To Do", "In Progress", "Done"].map((status) => {
                      const id = status.toLowerCase().replace(" ", "-");
                      return (
                        <ProjectColumn
                          key={id}
                          id={id}
                          title={status}
                          tasks={
                            projects[selectedProject]?.[id]?.tasks ||
                            projects[selectedProject]?.tasks?.[id] ||
                            []
                          }
                          moveTask={moveTask}
                          projectId={selectedProject}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </DndProvider>
  );
}

export default Dashboard;
