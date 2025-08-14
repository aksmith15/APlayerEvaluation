# Debug User Role Issue

## Problem
Super admin user can login but doesn't see Assignment Management tab.

## Expected
- `user.jwtRole` should be `'super_admin'` for kolbes@ridgelineei.com
- Assignment Management tab should be visible

## Debug Steps

1. **Check browser console after login** for:
   ```
   ✅ Tenant context initialized: {companyId, role}
   💾 Global profile cached: {email, id}
   ```

2. **In browser console, run**:
   ```javascript
   // Check current user object
   console.log('Current user:', JSON.stringify(window.__user_debug__, null, 2));
   ```

3. **Check people table data for your user**:
   ```sql
   SELECT id, email, name, jwt_role FROM people WHERE email = 'kolbes@ridgelineei.com';
   ```

4. **Check if authService is returning the correct jwtRole**

## Likely Issues

1. **authService not populating jwtRole correctly** after our fixes
2. **User object not updating** after tenant context changes  
3. **React state not refreshing** after authentication

## Fix Options

1. **Add debug logging** to authService and AuthContext
2. **Force refresh** of user object after tenant context established
3. **Check tenant context integration** with user object

