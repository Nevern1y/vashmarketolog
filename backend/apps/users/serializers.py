"""
API Serializers for User model and Authentication.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Only allows CLIENT and AGENT roles during self-registration.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    role = serializers.ChoiceField(
        choices=[('client', 'Клиент'), ('agent', 'Агент')],
        required=True
    )

    class Meta:
        model = User
        fields = [
            'email',
            'phone',
            'password',
            'password_confirm',
            'role',
            'first_name',
            'last_name',
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Пароли не совпадают.'
            })
        return attrs

    def create(self, validated_data):
        """Create a new user with encrypted password."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserLoginSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that includes user data in response.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims to token
        token['email'] = user.email
        token['role'] = user.role
        
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user info to response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'phone': self.user.phone,
            'role': self.user.role,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'is_active': self.user.is_active,
        }
        
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile (read/update).
    """
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone',
            'role',
            'first_name',
            'last_name',
            'is_active',
            'date_joined',
            'updated_at',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_active', 'date_joined', 'updated_at']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.
    """
    class Meta:
        model = User
        fields = [
            'phone',
            'first_name',
            'last_name',
        ]


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change.
    """
    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate_old_password(self, value):
        """Check that old password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Текущий пароль указан неверно.')
        return value

    def validate(self, attrs):
        """Check that new passwords match."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Новые пароли не совпадают.'
            })
        return attrs


class PartnerInviteSerializer(serializers.ModelSerializer):
    """
    Serializer for creating partner invites (Admin only).
    """
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name']

    def create(self, validated_data):
        """Create a partner user with invite token."""
        user = User.objects.create(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='partner',
            is_active=False,  # Inactive until invite is accepted
        )
        user.generate_invite_token()
        return user


class PartnerAcceptInviteSerializer(serializers.Serializer):
    """
    Serializer for accepting partner invite.
    """
    password = serializers.CharField(
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        """Check that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Пароли не совпадают.'
            })
        return attrs


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing users (Admin only).
    """
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone',
            'role',
            'first_name',
            'last_name',
            'is_active',
            'date_joined',
        ]
        read_only_fields = fields
