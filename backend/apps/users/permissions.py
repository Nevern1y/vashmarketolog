"""
Custom permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsClient(BasePermission):
    """
    Permission class for CLIENT role.
    """
    message = 'Доступ разрешён только для клиентов.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'client'
        )


class IsAgent(BasePermission):
    """
    Permission class for AGENT role.
    """
    message = 'Доступ разрешён только для агентов.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'agent'
        )


class IsPartner(BasePermission):
    """
    Permission class for PARTNER (Bank) role.
    """
    message = 'Доступ разрешён только для партнёров.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'partner'
        )


class IsAdmin(BasePermission):
    """
    Permission class for ADMIN role.
    Also allows Django superusers.
    """
    message = 'Доступ разрешён только для администраторов.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            (request.user.role == 'admin' or request.user.is_superuser)
        )


class IsClientOrAgent(BasePermission):
    """
    Permission for CLIENT or AGENT roles.
    Used for creating applications.
    """
    message = 'Доступ разрешён только для клиентов и агентов.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['client', 'agent']
        )


class IsOwner(BasePermission):
    """
    Object-level permission for accessing own resources.
    Checks 'owner', 'created_by', or 'user' fields on the object.
    """
    message = 'Доступ запрещён. Вы не являетесь владельцем ресурса.'

    def has_object_permission(self, request, view, obj):
        # Check various ownership fields
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # If no ownership field found, deny by default
        return False


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: owner or admin can access.
    """
    message = 'Доступ запрещён. Требуются права владельца или администратора.'

    def has_object_permission(self, request, view, obj):
        # Admins can access anything
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        
        # Check ownership
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class IsOwnerOrReadOnly(BasePermission):
    """
    Object-level permission: owner can modify, others can only read.
    """
    message = 'Редактирование доступно только владельцу.'

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in SAFE_METHODS:
            return True

        # Write permissions only for owner
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class PartnerReadOnly(BasePermission):
    """
    Partners can only read, not modify.
    Used with ReadOnlyModelViewSet for applications.
    """
    message = 'Партнёры имеют доступ только для чтения.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Partners can only use safe methods
        if request.user.role == 'partner':
            return request.method in SAFE_METHODS
        
        # Other roles have full access (subject to other permissions)
        return True


class CanAssignPartner(BasePermission):
    """
    Only Admin can assign applications to partners.
    """
    message = 'Назначать партнёров могут только администраторы.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            (request.user.role == 'admin' or request.user.is_superuser)
        )


class CanMakeDecision(BasePermission):
    """
    Only assigned Partner can make decisions on applications.
    """
    message = 'Принимать решения могут только назначенные партнёры.'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'partner'
        )

    def has_object_permission(self, request, view, obj):
        # Check if partner is assigned to this application
        return obj.assigned_partner == request.user
