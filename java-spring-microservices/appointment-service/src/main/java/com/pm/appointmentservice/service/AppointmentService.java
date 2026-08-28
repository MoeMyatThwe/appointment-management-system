package com.pm.appointmentservice.service;

import com.pm.appointmentservice.dto.AppointmentRequestDTO;
import com.pm.appointmentservice.dto.AppointmentResponseDTO;
import com.pm.appointmentservice.dto.AppointmentTimeChangeDTO;
import com.pm.appointmentservice.exception.TimeSlotAlreadyBookedException;
import com.pm.appointmentservice.exception.AppointmentNotFoundException;
import com.pm.appointmentservice.grpc.BillingServiceGrpcClient;
import com.pm.appointmentservice.kafka.KafkaProducer;
import com.pm.appointmentservice.mapper.AppointmentMapper;
import com.pm.appointmentservice.model.Appointment;
import com.pm.appointmentservice.repository.AppointmentRepository;
import java.util.List;
import java.util.UUID;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;

@Service
public class AppointmentService {

  private final AppointmentRepository appointmentRepository;
  private final BillingServiceGrpcClient billingServiceGrpcClient;
  private final KafkaProducer kafkaProducer;
  private final ScheduleService scheduleService;

  public AppointmentService(AppointmentRepository appointmentRepository,
      BillingServiceGrpcClient billingServiceGrpcClient,
      KafkaProducer kafkaProducer,
      ScheduleService scheduleService) {
    this.appointmentRepository = appointmentRepository;
    this.billingServiceGrpcClient = billingServiceGrpcClient;
    this.kafkaProducer = kafkaProducer;
    this.scheduleService = scheduleService;
  }

  public List<AppointmentResponseDTO> getAppointments(String tenantId) {
    List<Appointment> appointments = appointmentRepository.findAllByTenantId(tenantId);

    return appointments.stream().map(AppointmentMapper::toDTO).toList();
  }

  public AppointmentResponseDTO createAppointment(AppointmentRequestDTO appointmentRequestDTO,
      String tenantId) {
    scheduleService.validateAppointmentWindow(tenantId, appointmentRequestDTO.getStartTime(),
        appointmentRequestDTO.getEndTime());
    validateNoOverlap(appointmentRequestDTO, tenantId, null);

    Appointment newAppointment = appointmentRepository.save(
        AppointmentMapper.toModel(appointmentRequestDTO, tenantId));

    billingServiceGrpcClient.createBillingAccount(newAppointment.getId().toString(),
            newAppointment.getCustomerId(), newAppointment.getBusinessId());

    kafkaProducer.sendEvent(newAppointment);

    return AppointmentMapper.toDTO(newAppointment);
  }

  public AppointmentResponseDTO updateAppointment(UUID id,
      AppointmentRequestDTO appointmentRequestDTO, String tenantId) {

    Appointment appointment = appointmentRepository.findByIdAndTenantId(id, tenantId).orElseThrow(
        () -> new AppointmentNotFoundException("Appointment not found with ID: " + id));
    scheduleService.validateAppointmentWindow(tenantId, appointmentRequestDTO.getStartTime(),
        appointmentRequestDTO.getEndTime());
    validateNoOverlap(appointmentRequestDTO, tenantId, id);

    boolean rescheduled = !appointment.getStartTime().equals(appointmentRequestDTO.getStartTime())
        || !appointment.getEndTime().equals(appointmentRequestDTO.getEndTime());
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
    appointment.setUpdatedAt(appointmentRequestDTO.getStartTime());

    Appointment updatedAppointment = appointmentRepository.save(appointment);
    kafkaProducer.sendEvent(updatedAppointment,
        rescheduled ? "APPOINTMENT_RESCHEDULED" : "APPOINTMENT_UPDATED");
    return AppointmentMapper.toDTO(updatedAppointment);
  }

  public void deleteAppointment(UUID id, String tenantId) {
    Appointment appointment = appointmentRepository.findByIdAndTenantId(id, tenantId).orElseThrow(
        () -> new AppointmentNotFoundException("Appointment not found with ID: " + id));
    appointmentRepository.deleteByIdAndTenantId(id, tenantId);
    kafkaProducer.sendEvent(appointment, "APPOINTMENT_CANCELLED");
  }

  public AppointmentResponseDTO rescheduleAppointment(UUID id,
      AppointmentTimeChangeDTO timeChange, String tenantId) {
    Appointment appointment = appointmentRepository.findByIdAndTenantId(id, tenantId).orElseThrow(
        () -> new AppointmentNotFoundException("Appointment not found with ID: " + id));
    scheduleService.validateAppointmentWindow(tenantId, timeChange.startTime(), timeChange.endTime());
    if (appointmentRepository.existsStaffOverlap(tenantId, appointment.getStaffId(),
        timeChange.startTime(), timeChange.endTime())
        || appointmentRepository.existsCustomerOverlap(tenantId, appointment.getCustomerId(),
        timeChange.startTime(), timeChange.endTime(), id)
        || (appointment.getResourceId() != null && appointmentRepository.existsResourceOverlap(
        tenantId, appointment.getResourceId(), timeChange.startTime(), timeChange.endTime(), id))) {
      throw new TimeSlotAlreadyBookedException("The selected time overlaps another appointment");
    }
    appointment.setStartTime(timeChange.startTime());
    appointment.setEndTime(timeChange.endTime());
    appointment.setUpdatedAt(OffsetDateTime.now().toString());
    Appointment updated = appointmentRepository.save(appointment);
    kafkaProducer.sendEvent(updated, "APPOINTMENT_RESCHEDULED");
    return AppointmentMapper.toDTO(updated);
  }

  private void validateNoOverlap(AppointmentRequestDTO input, String tenantId, UUID appointmentId) {
    if (appointmentRepository.existsStaffOverlap(tenantId, input.getStaffId(),
        input.getStartTime(), input.getEndTime())
        || appointmentRepository.existsCustomerOverlap(tenantId, input.getCustomerId(),
        input.getStartTime(), input.getEndTime(), appointmentId)
        || (input.getResourceId() != null && !input.getResourceId().isBlank()
        && appointmentRepository.existsResourceOverlap(tenantId, input.getResourceId(),
        input.getStartTime(), input.getEndTime(), appointmentId))) {
      throw new TimeSlotAlreadyBookedException("The selected time overlaps another appointment");
    }
  }

  public AppointmentResponseDTO cancelAppointment(UUID id, String tenantId) {
    Appointment appointment = appointmentRepository.findByIdAndTenantId(id, tenantId).orElseThrow(
        () -> new AppointmentNotFoundException("Appointment not found with ID: " + id));
    appointment.setStatus("CANCELLED");
    appointment.setUpdatedAt(OffsetDateTime.now().toString());
    Appointment updated = appointmentRepository.save(appointment);
    kafkaProducer.sendEvent(updated, "APPOINTMENT_CANCELLED");
    return AppointmentMapper.toDTO(updated);
  }
}
