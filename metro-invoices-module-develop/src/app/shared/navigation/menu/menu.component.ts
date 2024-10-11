import { Component, OnInit, Input } from '@angular/core';
import { Router, Route, ActivatedRoute, NavigationStart } from '@angular/router';
import * as _ from 'lodash';
import { AuthService } from '../../security/auth/auth.service';
import { HasRoleDirective } from '../../security/auth/has-role.directive';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  viewProviders: [HasRoleDirective]
})
export class MenuComponent implements OnInit {

  currentRoutes: any[];
  hierarchicalRoutes: any[];
  expandedRoute: any;

  @Input()
  strategy = 'HIERARCHICAL';

  constructor(private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService) {

  }

  ngOnInit() {
    if (this.strategy === 'HIERARCHICAL') {
      this.router.events.subscribe(event => {
        if (event instanceof NavigationStart) {

          this.currentRoutes = [];
          this.filterPaths('', this.router.config, MenuComponent.removeFirstBackslash(event.url));

          _(this.currentRoutes).each(route => {
            route.subRoutes = undefined;
          });
          this.hierarchicalRoutes = this.makeTree(this.currentRoutes);

          _(this.hierarchicalRoutes).each(route => {
            route.subRoutes = _.sortBy(route.subRoutes,[(item)=>item.data.title.toLowerCase()]);
          });


        }
      });
    } else {
      this.currentRoutes = [];
        this.filterPaths('', this.router.config, '@@@@@@');
        _(this.currentRoutes).each(route => {
          route.subRoutes = undefined;
        });
        this.hierarchicalRoutes = this.makeTree(this.currentRoutes);

        _(this.hierarchicalRoutes).each(route => {
          route.subRoutes = _.sortBy(route.subRoutes,[(item)=>item.data.title.toLowerCase()]);
        });
    }

  }

  makeTree(arr: any[]): any[] {
    let nodes = {};
    return arr.filter((obj) => {
      let id = obj.data.menuConfig.id;
      let parentId = obj.data.menuConfig.module;

      nodes[id] = _.defaults(obj, nodes[id], { subRoutes: [] });
      parentId && (nodes[parentId] = (nodes[parentId] || { subRoutes: [] }))["subRoutes"].push(obj);

      return !parentId;
    });
  }


  static removeFirstBackslash(url: string) {
    const index = url.indexOf('/');
    return index === 0 ? (url.length === 1 ? '' : url.substring(index + 1)) : url;
  }

  filterPaths(parent: string, config: Route[], activatedPath: string) {


    for (let i = 0; i < this.router.config.length; i++) {
      const route = this.router.config[i];
      const thispath = MenuComponent.removeFirstBackslash(parent + '/' + route.path);


      if (!!route.data && !!route.data.menuConfig && (
        (!route.data.menuConfig.include && !route.data.menuConfig.exclude)
        // || (!!_.find(route.data.menuConfig.include,'@path') && thispath === activatedPath)
        // || (!!_.find(route.data.menuConfig.include, activatedPath))
        || ((thispath === activatedPath && _.indexOf(route.data.menuConfig.exclude, '@path') === -1)
          || (thispath !== activatedPath && _.indexOf(route.data.menuConfig.exclude, activatedPath) === -1))
      )) {
        this.currentRoutes.push(route);
      } else {
        console.debug('NOT INCLUDED: ' + thispath);
      }


      if (route.children) {
        const currentPath = route.path ? parent + '/' + route.path : parent;
        this.filterPaths(currentPath, route.children, activatedPath);
      }
    }
  }

  show(route:Route) {
    if (!this.expandedRoute) {
      this.expandedRoute = route.path;
    } else {
      this.expandedRoute = null;
    }
  }
  isExpanded(route:Route) {
    return this.expandedRoute === route.path;
  }

}
