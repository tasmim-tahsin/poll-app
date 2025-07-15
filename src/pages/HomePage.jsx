import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const HomePage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
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
              <Link
                key={session.id}
                to={`/poll/${session.id}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <h2 className="text-xl font-bold text-blue-600 mb-2">{session.id}</h2>
                <p className="text-gray-700">{session.question}</p>
                <p className="text-sm text-gray-500 mt-4">
                  Created: {new Date(session.created_at).toLocaleDateString()}
                </p>
              </Link>
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
