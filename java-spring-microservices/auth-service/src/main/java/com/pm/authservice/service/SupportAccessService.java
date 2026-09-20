package com.pm.authservice.service;

import com.pm.authservice.dto.SupportAccessDTO;
import com.pm.authservice.dto.PlatformAuditEventDTO;
import com.pm.authservice.model.PlatformAuditEvent;
import com.pm.authservice.model.SupportAccessGrant;
import com.pm.authservice.repository.PlatformAuditEventRepository;
import com.pm.authservice.repository.SupportAccessGrantRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class SupportAccessService {
  private final SupportAccessGrantRepository grants;
  private final PlatformAuditEventRepository audit;

  public SupportAccessService(SupportAccessGrantRepository grants,
      PlatformAuditEventRepository audit) {
    this.grants = grants;
    this.audit = audit;
  }

  public SupportAccessDTO request(String tenantId, String actor, String reason, int durationMinutes) {
    if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Support reason is required");
    if (durationMinutes < 15 || durationMinutes > 240) {
      throw new IllegalArgumentException("Support duration must be between 15 and 240 minutes");
    }
    SupportAccessGrant grant = new SupportAccessGrant();
    grant.setId(UUID.randomUUID());
    grant.setTenantId(tenantId);
    grant.setRequestedBy(actor);
    grant.setReason(reason.trim());
    grant.setDurationMinutes(durationMinutes);
    grant.setStatus("PENDING_CONSENT");
    grant.setCreatedAt(Instant.now());
    grants.save(grant);
    record(actor, "PLATFORM_ADMIN", tenantId, "SUPPORT_ACCESS_REQUESTED", grant.getReason());
    return toDto(grant);
  }

  public SupportAccessDTO consent(UUID id, String tenantId, String actor, boolean approved) {
    SupportAccessGrant grant = grants.findById(id).orElseThrow(() -> new IllegalArgumentException("Support request not found"));
    if (!grant.getTenantId().equals(tenantId) || !"PENDING_CONSENT".equals(grant.getStatus())) {
      throw new IllegalArgumentException("Support request is not available for consent");
    }
    grant.setConsentedBy(actor);
    grant.setConsentedAt(Instant.now());
    grant.setStatus(approved ? "ACTIVE" : "DECLINED");
    if (approved) grant.setExpiresAt(Instant.now().plusSeconds(grant.getDurationMinutes() * 60L));
    grants.save(grant);
    record(actor, "TENANT_ADMIN", tenantId, approved ? "SUPPORT_ACCESS_APPROVED" : "SUPPORT_ACCESS_DECLINED", grant.getReason());
    return toDto(grant);
  }

  public SupportAccessDTO revoke(UUID id, String actor) {
    SupportAccessGrant grant = grants.findById(id).orElseThrow(() -> new IllegalArgumentException("Support request not found"));
    if (!"ACTIVE".equals(grant.getStatus())) throw new IllegalArgumentException("Only active support access can be revoked");
    grant.setStatus("REVOKED");
    grant.setRevokedAt(Instant.now());
    grants.save(grant);
    record(actor, "PLATFORM_ADMIN", grant.getTenantId(), "SUPPORT_ACCESS_REVOKED", grant.getReason());
    return toDto(grant);
  }

  public List<SupportAccessDTO> all() {
    return grants.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
  }

  public List<SupportAccessDTO> forTenant(String tenantId) {
    return grants.findAllByTenantIdOrderByCreatedAtDesc(tenantId).stream().map(this::toDto).toList();
  }

  public List<PlatformAuditEventDTO> auditEvents(String tenantId, String actor, String action) {
    return audit.findTop100ByOrderByCreatedAtDesc().stream()
        .filter(event -> tenantId == null || tenantId.isBlank() || tenantId.equals(event.getTenantId()))
        .filter(event -> actor == null || actor.isBlank() || event.getActorEmail().toLowerCase().contains(actor.toLowerCase()))
        .filter(event -> action == null || action.isBlank() || event.getAction().equalsIgnoreCase(action))
        .map(event -> new PlatformAuditEventDTO(event.getId(), event.getActorEmail(),
            event.getActorRole(), event.getTenantId(), event.getAction(),
            event.getDetails(), event.getCreatedAt()))
        .toList();
  }

  public Page<PlatformAuditEventDTO> auditEvents(Pageable pageable, String tenantId, String actor, String action) {
    return audit.search(tenantId == null ? "" : tenantId.trim(), actor == null ? "" : actor.trim(),
        action == null ? "" : action.trim(), pageable)
        .map(event -> new PlatformAuditEventDTO(event.getId(), event.getActorEmail(),
            event.getActorRole(), event.getTenantId(), event.getAction(),
            event.getDetails(), event.getCreatedAt()));
  }

  private void record(String actor, String role, String tenantId, String action, String details) {
    PlatformAuditEvent event = new PlatformAuditEvent();
    event.setId(UUID.randomUUID());
    event.setActorEmail(actor);
    event.setActorRole(role);
    event.setTenantId(tenantId);
    event.setAction(action);
    event.setDetails(details);
    event.setCreatedAt(Instant.now());
    audit.save(event);
  }

  private SupportAccessDTO toDto(SupportAccessGrant grant) {
    return new SupportAccessDTO(grant.getId(), grant.getTenantId(), grant.getRequestedBy(),
        grant.getReason(), grant.getDurationMinutes(), grant.getStatus(), grant.getConsentedBy(),
        grant.getCreatedAt(), grant.getConsentedAt(), grant.getExpiresAt(), grant.getRevokedAt());
  }
}
