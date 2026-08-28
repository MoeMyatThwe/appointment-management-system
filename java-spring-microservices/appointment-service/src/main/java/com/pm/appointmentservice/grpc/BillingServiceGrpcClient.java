package com.pm.appointmentservice.grpc;

import billing.BillingRequest;
import billing.BillingResponse;
import billing.BillingServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BillingServiceGrpcClient {

  private static final Logger log = LoggerFactory.getLogger(
      BillingServiceGrpcClient.class);
  private final BillingServiceGrpc.BillingServiceBlockingStub blockingStub;

  public BillingServiceGrpcClient(
      @Value("${billing.service.address:localhost}") String serverAddress,
      @Value("${billing.service.grpc.port:9001}") int serverPort) {

    log.info("Connecting to Billing Service GRPC service at {}:{}",
        serverAddress, serverPort);

    ManagedChannel channel = ManagedChannelBuilder.forAddress(serverAddress,
        serverPort).usePlaintext().build();

    blockingStub = BillingServiceGrpc.newBlockingStub(channel);
  }

  public BillingResponse createBillingAccount(String appointmentId, String name,
      String email) {

    BillingRequest request = BillingRequest.newBuilder().setAppointmentId(appointmentId)
        .setName(name).setEmail(email).build();

    StatusRuntimeException lastFailure = null;
    for (int attempt = 1; attempt <= 3; attempt++) {
      try {
        BillingResponse response = blockingStub.withDeadlineAfter(3, TimeUnit.SECONDS)
            .createBillingAccount(request);
        log.info("Received response from billing service via GRPC: {}", response);
        return response;
      } catch (StatusRuntimeException exception) {
        lastFailure = exception;
        log.warn("Billing gRPC attempt {} failed with status {}", attempt,
            exception.getStatus().getCode());
      }
    }

    throw lastFailure;
  }
}
