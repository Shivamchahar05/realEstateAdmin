import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { PermissionService } from '../core/services/permission.service';
import { NAV_LINKS, hasPermission } from '../core/permissions';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss',
})
export class ShellLayoutComponent {
  readonly auth = inject(AuthService);
  readonly permissions = inject(PermissionService);
  readonly appName = environment.appName;

  readonly links = computed(() => {
    const role = this.auth.user()?.role;
    return NAV_LINKS.filter((link) => hasPermission(role, link.permission));
  });
}
