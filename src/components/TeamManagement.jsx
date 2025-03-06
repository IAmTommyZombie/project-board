import { useState, useEffect } from "react";
import { ref, push, onValue, remove } from "firebase/database";
import { db } from "../firebase";

function TeamManagement({ projectId }) {
  const [email, setEmail] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [error, setError] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const teamRef = ref(db, `projects/${projectId}/team`);
    const unsubscribe = onValue(teamRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const members = Object.entries(data).map(([key, value]) => ({
          id: key,
          email: value.email,
          invitedAt: value.invitedAt,
        }));
        setTeamMembers(members);
      } else {
        setTeamMembers([]);
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleInvite = (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter an email.");
      return;
    }

    setError("");
    setIsInviting(true);
    const teamRef = ref(db, `projects/${projectId}/team`);
    push(teamRef, { email, invitedAt: new Date().toISOString() })
      .then(() => {
        setEmail("");
        setIsInviting(false);
      })
      .catch((error) => {
        console.error("Error inviting member:", error);
        setError("Failed to invite member: " + error.message);
        setIsInviting(false);
      });
  };

  const handleRemove = (memberId) => {
    const memberRef = ref(db, `projects/${projectId}/team/${memberId}`);
    remove(memberRef)
      .then(() => console.log("Member removed successfully"))
      .catch((error) => {
        console.error("Error removing member:", error);
        setError("Failed to remove member: " + error.message);
      });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 sm:text-xl">
        Team for Project: {projectId}
      </h2>
      <form onSubmit={handleInvite} className="mb-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Invite by email"
          className="w-full p-3 border rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
        />
        <button
          type="submit"
          className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 disabled:bg-gray-400 text-sm sm:text-base"
          disabled={isInviting}
        >
          {isInviting ? "Inviting..." : "Invite"}
        </button>
        {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
      </form>
      <div className="mt-3">
        <h3 className="text-md font-medium mb-2 text-gray-700 sm:text-lg">
          Team Members
        </h3>
        {teamMembers.length === 0 ? (
          <p className="text-gray-500 text-sm">No team members yet.</p>
        ) : (
          <ul className="list-disc pl-5">
            {teamMembers.map((member) => (
              <li
                key={member.id}
                className="flex justify-between items-center py-2"
              >
                <span className="text-gray-800 text-sm sm:text-base">
                  {member.email} (Invited:{" "}
                  {new Date(member.invitedAt).toLocaleDateString()})
                </span>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="ml-4 p-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TeamManagement;
