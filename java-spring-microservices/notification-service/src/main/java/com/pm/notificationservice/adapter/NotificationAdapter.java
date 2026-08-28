package com.pm.notificationservice.adapter;

import appointment.events.AppointmentEvent;

public interface NotificationAdapter {
  void send(AppointmentEvent event);
}
