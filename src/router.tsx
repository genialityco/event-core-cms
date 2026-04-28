import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/login/LoginPage'
import OrganizationsPage from '@/pages/organizations/OrganizationsPage'
import OrganizationDetailPage from '@/pages/organizations/OrganizationDetailPage'
import EventsPage from '@/pages/events/EventsPage'
import EventFormConfigPage from '@/pages/events/EventFormConfigPage'
import TravelersPage from '@/pages/travelers/TravelersPage'
import HotelsPage from '@/pages/hotels/HotelsPage'
import AgendaPage from '@/pages/agenda/AgendaPage'
import SpeakersPage from '@/pages/speakers/SpeakersPage'
import UsefulInfoPage from '@/pages/useful-info/UsefulInfoPage'
import PreRegistrationPage from '@/pages/pre-registration/PreRegistrationPage'
import PhotosPage from '@/pages/photos/PhotosPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/organizations" replace /> },
      { path: 'organizations', element: <OrganizationsPage /> },
      { path: 'organizations/:id', element: <OrganizationDetailPage /> },
      { path: 'organizations/:id/events', element: <EventsPage /> },
      { path: 'organizations/:id/events/:eventId/traveler-config', element: <EventFormConfigPage /> },
      { path: 'organizations/:id/events/:eventId/travelers', element: <TravelersPage /> },
      { path: 'organizations/:id/events/:eventId/hotels', element: <HotelsPage /> },
      { path: 'organizations/:id/events/:eventId/agenda', element: <AgendaPage /> },
      { path: 'organizations/:id/events/:eventId/speakers', element: <SpeakersPage /> },
      { path: 'organizations/:id/events/:eventId/useful-info', element: <UsefulInfoPage /> },
      { path: 'organizations/:id/events/:eventId/photos', element: <PhotosPage /> },
      // Pre-registro: accesible desde evento o desde org directamente
      { path: 'organizations/:id/events/:eventId/pre-registration', element: <PreRegistrationPage /> },
      { path: 'organizations/:id/pre-registration', element: <PreRegistrationPage /> },
    ],
  },
])
