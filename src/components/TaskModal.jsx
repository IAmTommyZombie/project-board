import { useState } from "react";
import { ref, update, remove } from "firebase/database"; // Added remove for deleting tasks
import { db } from "../firebase";

function TaskModal({ task, columnId, projectId, onClose, onDelete }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [assignee, setAssignee] = useState(task.assignee || "");
  const [priority, setPriority] = useState(task.priority || "Medium");

  const handleSave = () => {
    const taskRef = ref(
      db,
      `projects/${projectId}/tasks/${columnId}/${task.id}`
    );
    update(taskRef, {
      title,
      description,
      dueDate,
      assignee,
      priority,
    }).then(() => onClose());
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const taskRef = ref(
        db,
        `projects/${projectId}/tasks/${columnId}/${task.id}`
      );
      remove(taskRef)
        .then(() => {
          console.log("Task deleted successfully");
          onClose(); // Close modal after deletion
        })
        .catch((error) => console.error("Error deleting task:", error));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-3 text-gray-800">Edit Task</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task Title"
          className="w-full p-3 border rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-3 border rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          rows="4"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full p-3 border rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
        />
        <input
          type="text"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Assignee (email)"
          className="w-full p-3 border rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full p-3 border rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <div className="flex justify-between gap-2 mt-3">
          <button
            onClick={handleDelete}
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200 text-sm sm:text-base"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="p-2 bg-gray-300 rounded hover:bg-gray-400 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 text-sm sm:text-base"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
