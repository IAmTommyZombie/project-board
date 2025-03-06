import { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { ref, push, update, remove } from "firebase/database"; // Added remove for deleting tasks
import { db } from "../firebase";
import TaskModal from "./TaskModal";

const ItemType = "task";

function ProjectColumn({ title, tasks, id, moveTask, projectId }) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle) {
      setError("Task title cannot be empty.");
      return;
    }

    setError("");
    setIsAdding(true);
    try {
      console.log("Current projectId:", projectId);
      const tasksRef = ref(db, `projects/${projectId}/tasks/${id}`);
      console.log(
        "Attempting to add task to:",
        `projects/${projectId}/tasks/${id}`
      );
      const newTaskRef = await push(tasksRef, {
        title: newTaskTitle,
        status: id,
        createdAt: new Date().toISOString(),
        description: "",
        dueDate: "",
        assignee: "",
        priority: "Medium",
      });
      console.log("Task added successfully with key:", newTaskRef.key);
      setNewTaskTitle("");
    } catch (error) {
      console.error("Error adding task:", error);
      setError("Failed to add task: " + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const taskRef = ref(db, `projects/${projectId}/tasks/${id}/${taskId}`);
      console.log(
        "Attempting to delete task from:",
        `projects/${projectId}/tasks/${id}/${taskId}`
      );
      await remove(taskRef);
      console.log("Task deleted successfully");
      if (selectedTask?.id === taskId) {
        setSelectedTask(null); // Close modal if deleting the selected task
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task: " + error.message);
    }
  };

  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    drop: (item, monitor) => {
      console.log("Drop event on column:", id, "with item:", item);
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        moveTask(item.id, item.sourceId, id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  console.log(`Rendering tasks for ${id} in project ${projectId}:`, tasks);

  // Determine background color based on title
  const getColumnColor = () => {
    switch (title) {
      case "To Do":
        return "bg-green-100"; // Light green
      case "In Progress":
        return "bg-yellow-100"; // Light yellow
      case "Done":
        return "bg-red-100"; // Light red
      default:
        return "bg-white"; // Default to white if title is unexpected
    }
  };

  return (
    <div
      ref={drop}
      className={`p-4 rounded-lg shadow-md border border-gray-200 ${getColumnColor()} ${
        isOver ? "border-indigo-500" : ""
      }`}
    >
      <h2 className="text-lg font-semibold mb-3 text-gray-800 sm:text-xl">
        {title}
      </h2>
      <form onSubmit={handleAddTask} className="mb-3">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="New task"
          className="w-full p-3 border rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
        />
        <button
          type="submit"
          className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-gray-400 text-sm sm:text-base"
          disabled={isAdding}
        >
          {isAdding ? "Adding..." : "Add Task"}
        </button>
        {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
      </form>
      <div className="space-y-2">
        {Object.entries(tasks).map(([taskId, task]) => (
          <TaskItem
            key={taskId}
            id={taskId}
            title={task.title}
            sourceId={id}
            projectId={projectId}
            onClick={() => setSelectedTask({ id: taskId, ...task })}
            priority={task.priority}
            onDelete={handleDeleteTask} // Pass delete function
          />
        ))}
      </div>
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          columnId={id}
          projectId={projectId}
          onClose={() => setSelectedTask(null)}
          onDelete={handleDeleteTask} // Pass delete function to modal
        />
      )}
    </div>
  );
}

function TaskItem({
  id,
  title,
  sourceId,
  projectId,
  onClick,
  priority,
  onDelete,
}) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id, sourceId, projectId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  console.log(
    "Drag state for task",
    id,
    "in project",
    projectId,
    ":",
    isDragging
  );

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`bg-white p-3 mb-2 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition duration-200 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm sm:text-base">{title}</span>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold rounded px-2 py-1 ${
              priority === "High"
                ? "bg-red-100 text-red-800"
                : priority === "Medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {priority}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening modal
              onDelete(id);
            }}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200 text-xs"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectColumn;
