package org.calik.sharedhomefinance.domain.user.service;

import org.calik.sharedhomefinance.common.exception.BusinessException;
import org.calik.sharedhomefinance.common.exception.ResourceNotFoundException;
import org.calik.sharedhomefinance.domain.settings.service.UserSettingsService;
import org.calik.sharedhomefinance.domain.user.dto.RegisterRequest;
import org.calik.sharedhomefinance.domain.user.dto.UserResponse;
import org.calik.sharedhomefinance.domain.user.entity.User;
import org.calik.sharedhomefinance.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserSettingsService userSettingsService;

    @InjectMocks
    private UserServiceImpl userService;

    private User existingUser;
    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        existingUser = User.builder()
                .firebaseUid("uid-123")
                .name("Test User")
                .email("test@example.com")
                .build();

        // RegisterRequest is a record with fields: name, email, profilePhotoUrl
        registerRequest = new RegisterRequest("Test User", "test@example.com", null);
    }

    @Test
    void registerOrLogin_whenUserExists_returnsExistingUserWithoutSaving() {
        when(userRepository.findByFirebaseUid("uid-123")).thenReturn(Optional.of(existingUser));

        UserResponse result = userService.registerOrLogin("uid-123", registerRequest);

        assertThat(result.email()).isEqualTo("test@example.com");
        verify(userRepository, never()).save(any());
        verify(userSettingsService, never()).createDefaultSettings(any());
    }

    @Test
    void registerOrLogin_whenUserNotExists_createsNewUser() {
        when(userRepository.findByFirebaseUid("uid-new")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        User saved = User.builder()
                .firebaseUid("uid-new")
                .name("Test User")
                .email("test@example.com")
                .build();
        when(userRepository.save(any(User.class))).thenReturn(saved);

        UserResponse result = userService.registerOrLogin("uid-new", registerRequest);

        assertThat(result.email()).isEqualTo("test@example.com");
        verify(userRepository).save(any(User.class));
        verify(userSettingsService).createDefaultSettings(any(User.class));
    }

    @Test
    void registerOrLogin_whenEmailAlreadyExists_throwsBusinessException() {
        when(userRepository.findByFirebaseUid("uid-new")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.registerOrLogin("uid-new", registerRequest))
                .isInstanceOf(BusinessException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void getByFirebaseUid_whenNotFound_throwsResourceNotFoundException() {
        when(userRepository.findByFirebaseUid("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getByFirebaseUid("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getByFirebaseUid_whenFound_returnsUser() {
        when(userRepository.findByFirebaseUid("uid-123")).thenReturn(Optional.of(existingUser));

        User result = userService.getByFirebaseUid("uid-123");

        assertThat(result.getFirebaseUid()).isEqualTo("uid-123");
    }
}
