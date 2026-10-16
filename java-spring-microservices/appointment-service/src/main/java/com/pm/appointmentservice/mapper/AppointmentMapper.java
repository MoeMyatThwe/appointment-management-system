package com.pm.appointmentservice.mapper;

import com.pm.appointmentservice.dto.AppointmentRequestDTO;
import com.pm.appointmentservice.dto.AppointmentResponseDTO;
import com.pm.appointmentservice.model.Appointment;

public class AppointmentMapper {
  public static AppointmentResponseDTO toDTO(Appointment appointment) {
    AppointmentResponseDTO appointmentDTO = new AppointmentResponseDTO();
    appointmentDTO.setId(appointment.getId().toString());
    appointmentDTO.setBusinessId(appointment.getBusinessId());
    appointmentDTO.setCustomerId(appointment.getCustomerId());
    appointmentDTO.setStaffId(appointment.getStaffId());
    appointmentDTO.setServiceId(appointment.getServiceId());
    appointmentDTO.setResourceId(appointment.getResourceId());
    appointmentDTO.setCalendarId(appointment.getCalendarId());
    appointmentDTO.setStartTime(appointment.getStartTime());
    appointmentDTO.setEndTime(appointment.getEndTime());
    appointmentDTO.setStatus(appointment.getStatus() == null
        ? null
        : appointment.getStatus().trim().toUpperCase());
    appointmentDTO.setNotes(appointment.getNotes());
    appointmentDTO.setCreatedAt(appointment.getCreatedAt());
    appointmentDTO.setUpdatedAt(appointment.getUpdatedAt());

    return appointmentDTO;
  }

  public static Appointment toModel(AppointmentRequestDTO appointmentRequestDTO,
      String tenantId) {
    Appointment appointment = new Appointment();
    appointment.setTenantId(tenantId);
    appointment.setBusinessId(appointmentRequestDTO.getBusinessId());
    appointment.setCustomerId(appointmentRequestDTO.getCustomerId());
    appointment.setStaffId(appointmentRequestDTO.getStaffId());
    appointment.setServiceId(appointmentRequestDTO.getServiceId());
    appointment.setResourceId(appointmentRequestDTO.getResourceId());
    appointment.setCalendarId(appointmentRequestDTO.getCalendarId());
    appointment.setStartTime(appointmentRequestDTO.getStartTime());
    appointment.setEndTime(appointmentRequestDTO.getEndTime());
    appointment.setStatus(appointmentRequestDTO.getStatus());
    appointment.setNotes(appointmentRequestDTO.getNotes());
    appointment.setCreatedAt(appointmentRequestDTO.getStartTime());
    appointment.setUpdatedAt(appointmentRequestDTO.getStartTime());
    return appointment;
  }
}
