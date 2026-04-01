function buildDashboardStats(appointments) {
  const today = new Date().toDateString();

  return {
    totalAppointments: appointments.length,
    todayAppointments: appointments.filter((apt) => new Date(apt.date).toDateString() === today).length,
    pendingAppointments: appointments.filter((apt) => apt.status === 'pending').length,
    completedAppointments: appointments.filter((apt) => apt.status === 'completed').length
  };
}

module.exports = {
  buildDashboardStats
};
