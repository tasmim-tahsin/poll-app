import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const HomePage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, questions(count)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id) => {
    const url = `${window.location.origin}/poll/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Welcome to PollApp</h1>
          <p className="text-gray-600 mt-2">Join an active poll session below.</p>
        </div>

        {sessions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
                <div>
                  <Link to={`/poll/${session.id}`} className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-blue-600 mb-2 hover:underline">{session.id}</h2>
                    {session.user_password && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </Link>
                  <p className="text-gray-700">
                    {session.questions[0]?.count || 0} {session.questions[0]?.count === 1 ? 'question' : 'questions'}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Created: {new Date(session.created_at).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => handleCopy(session.id)}
                    className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {copiedId === session.id ? 'Copied!' : 'Copy Poll URL'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-lg shadow-md p-12">
            <h2 className="text-2xl font-semibold text-gray-700">No Active Polls</h2>
            <p className="text-gray-500 mt-2">There are no active poll sessions at the moment. Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
