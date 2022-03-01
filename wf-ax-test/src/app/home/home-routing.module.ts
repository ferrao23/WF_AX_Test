import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomePage } from './home.page';
import { SignedInPage } from './signed-in.page';

const routes: Routes = [
  {
    path: '',
    component: HomePage
  },
  {
    path: 'list',
    component: SignedInPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule {}
