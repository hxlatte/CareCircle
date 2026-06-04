import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useVoice } from '../../hooks/useVoice';
import { useLanguage } from '../../context/LanguageContext';

export default function FamilyTasks() {
  const { startVoiceInput } = useVoice();
  const { t, language } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [seniorId, setSeniorId] = useState('');
  const [seniorName, setSeniorName] = useState('Senior');
  const [loading, setLoading] = useState(true);

  const fetchTasksData = async () => {
    try {
      const meRes = await api.get('/auth/me');
      const targetId = meRes.data.role === 'family' ? meRes.data.linkedSeniorId : meRes.data._id;
      
      if (!targetId) {
        console.warn('No linked senior found');
        setLoading(false);
        return;
      }
      setSeniorId(targetId);

      const [tasksRes, insightsRes] = await Promise.all([
        api.get(`/tasks/${targetId}`),
        api.get(`/insights/${targetId}`)
      ]);
      
      setTasks(tasksRes.data);
      setSeniorName(insightsRes.data.seniorName || 'Senior');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      if (!seniorId) return alert('No senior linked to this family account.');
      await api.post('/tasks', {
        title: newTaskTitle,
        assignedTo: seniorId,
        dueDate: newTaskDate,
        languageCode: language
      });
      alert(`Task assigned to ${seniorName} successfully!`);
      setNewTaskTitle('');
      setNewTaskDate('');
      fetchTasksData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign task. Please try again.');
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-stone-400 font-bold">Loading tasks...</div>;

  const todoTasks = tasks.filter(t => t.status !== 'completed');
  const doneTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="flex flex-col animate-[fadeIn_0.5s_ease-out] max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--color-primary)] mb-2 tracking-tight">
          Task Coordination
        </h2>
        <p className="text-xl text-[var(--color-on-surface-variant)]">Monitor and assign daily activities for {seniorName}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Task Lists */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Tasks */}
          <div className="bg-[var(--color-surface-container-lowest)] p-8 rounded-[2rem] shadow-sm border border-stone-100">
            <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[var(--color-warning)] text-3xl">pending_actions</span>
              Pending Tasks
              <span className="bg-orange-100 text-[var(--color-warning)] px-3 py-1 rounded-full text-sm ml-2">{todoTasks.length}</span>
            </h3>
            
            <div className="space-y-4">
              {todoTasks.map(task => (
                <div key={task._id} className="bg-white p-6 border border-stone-200 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow animate-[slideRight_0.3s_ease-out]">
                  <div>
                    <h4 className="font-bold text-xl text-stone-800">{task.title_en || task.title}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs font-medium text-stone-400">
                      <p><span className="font-bold text-stone-500 uppercase tracking-tighter">Telugu:</span> {task.title_te || '...'}</p>
                      <p><span className="font-bold text-stone-500 uppercase tracking-tighter">Hindi:</span> {task.title_hi || '...'}</p>
                      <p><span className="font-bold text-stone-500 uppercase tracking-tighter">Marathi:</span> {task.title_mr || '...'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <p className="text-sm font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">person</span>
                        For: {seniorName}
                      </p>
                      <p className="text-sm font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">event</span>
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Today'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-orange-50 text-[var(--color-warning)] px-4 py-2 rounded-full text-sm font-bold border border-orange-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      Status: Pending
                    </span>
                    <button className="text-sm font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm">notifications</span> Send Reminder
                    </button>
                  </div>
                </div>
              ))}
              {todoTasks.length === 0 && <p className="text-stone-500 italic p-4 text-center bg-stone-50 rounded-xl">No pending tasks for {seniorName}.</p>}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-200 shadow-sm">
            <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-3 mb-6 opacity-80">
              <span className="material-symbols-outlined text-[var(--color-success)] text-3xl">task_alt</span>
              Completed Today
              <span className="bg-green-100 text-[var(--color-success)] px-3 py-1 rounded-full text-sm ml-2">{doneTasks.length}</span>
            </h3>
            
            <div className="space-y-4">
              {doneTasks.map(task => (
                <div key={task._id} className="bg-white p-6 border border-stone-100 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 opacity-80">
                  <div>
                    <h4 className="font-bold text-xl text-stone-500 line-through">{task.title_en || task.title}</h4>
                    <p className="text-sm font-bold text-[var(--color-success)] flex items-center gap-1 mt-3 bg-green-50 px-3 py-1 rounded-full w-fit">
                      <span className="material-symbols-outlined text-base">verified</span>
                      Completed by {seniorName} • {task.completedAt ? new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Today'}
                    </p>
                  </div>
                </div>
              ))}
              {doneTasks.length === 0 && <p className="text-stone-500 italic p-4 text-center">No tasks completed yet.</p>}
            </div>
          </div>
        </div>

        {/* Right Column: Add Task & Messaging */}
        <div className="space-y-8">
          {/* Add Task Form */}
          <div className="bg-[var(--color-primary-container)] p-8 rounded-[2rem] shadow-sm">
            <h3 className="text-2xl font-extrabold text-[var(--color-on-primary-container)] flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-3xl">add_task</span>
              Assign New Task
            </h3>
            
            <form className="space-y-5" onSubmit={handleAddTask}>
              <div>
                <label className="block text-sm font-bold text-[var(--color-on-primary-container)] mb-2 uppercase tracking-widest">Task Title</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 p-4 text-lg border-none rounded-xl focus:ring-4 focus:ring-[var(--color-primary)]/20 shadow-sm outline-none text-stone-800" 
                    placeholder="E.g., Call the doctor" 
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => startVoiceInput(setNewTaskTitle)}
                    className="p-4 bg-white text-[var(--color-primary)] rounded-xl shadow-sm hover:bg-stone-50 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--color-on-primary-container)] mb-2 uppercase tracking-widest">Due Date</label>
                <input 
                  type="date" 
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full p-4 text-lg border-none rounded-xl focus:ring-4 focus:ring-[var(--color-primary)]/20 shadow-sm outline-none text-stone-800" 
                  required
                />
              </div>
              
              <button type="submit" className="w-full bg-[var(--color-primary)] text-white font-extrabold text-xl py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer">
                <span className="material-symbols-outlined">send</span> Send Task
              </button>
            </form>
          </div>

          {/* Messaging Section */}
          <FamilyMessaging seniorId={seniorId} seniorName={seniorName} />
        </div>

      </div>
    </div>
  );
}

function FamilyMessaging({ seniorId, seniorName }) {
  const [msg, setMsg] = useState('');
  const [recentMsgs, setRecentMsgs] = useState([]);
  const { startVoiceInput } = useVoice();
  const { language } = useLanguage();

  const fetchMessages = async () => {
    if (!seniorId) return;
    try {
      const res = await api.get(`/messages/${seniorId}`);
      setRecentMsgs(res.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [seniorId]);

  const handleSendMsg = async (e) => {
    e.preventDefault();
    try {
      await api.post('/messages', { 
        text: msg, 
        receiverId: seniorId,
        languageCode: language
      });
      setMsg('');
      fetchMessages();
      alert('Note sent to ' + seniorName);
    } catch (err) {
      alert('Failed to send note');
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
      <h3 className="text-2xl font-black text-stone-800 flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-[var(--color-primary)]">chat</span>
        Notes for {seniorName}
      </h3>
      
      <form onSubmit={handleSendMsg} className="space-y-4 mb-8">
        <div className="relative">
          <textarea 
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Type a loving note or reminder..."
            className="w-full p-4 rounded-xl border border-stone-100 bg-stone-50 font-bold focus:ring-2 focus:ring-[var(--color-primary)] outline-none min-h-[100px]"
            required
          />
          <button 
            type="button"
            onClick={() => startVoiceInput(setMsg)}
            className="absolute right-4 bottom-4 p-2 bg-white text-[var(--color-primary)] rounded-lg shadow-sm hover:bg-stone-50 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">mic</span>
          </button>
        </div>
        <button className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">send</span> Send Note
        </button>
      </form>

      <div className="space-y-3">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Recent Notes</p>
        {recentMsgs.map((m, idx) => (
          <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-stone-100 italic text-stone-600 text-sm">
            "{m.text}"
          </div>
        ))}
        {recentMsgs.length === 0 && <p className="text-stone-400 text-xs italic">No notes sent yet today.</p>}
      </div>
    </div>
  );
}
