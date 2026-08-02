'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  FleetMap,
  Icon,
  Num,
  PageHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type MapSite,
} from '@gaia/ui';
import { SITES, orgName } from '@gaia/core';

/**
 * §3 `/(coordinator)/admin/sites` — polygon drawing.
 *
 * §15: pit polygons move as pits are worked, and re-drawing is routine rather
 * than an edge case. So this screen is built as an editing surface, not a
 * reference list — the boundary is the thing that gates every camera and every
 * transition, and it changes on a schedule the ops team sets, not the software.
 *
 * The side panel now carries a real map of whichever row is selected, rather
 * than a static placeholder for one hardcoded pit. Drawing/dragging a vertex
 * is still a placeholder until there is a Mapbox token (§13) — that
 * interaction, not the map itself, is the part worth reviewing before it is
 * built.
 */
export default function SitesPage() {
  const [selectedId, setSelectedId] = useState(SITES[0]?.id);
  const selected = SITES.find((s) => s.id === selectedId) ?? SITES[0];

  const mapSites: MapSite[] = selected
    ? [
        {
          id: selected.id,
          name: selected.name,
          kind: selected.kind === 'pit' ? 'pit' : 'delivery',
          lat: selected.lat,
          lng: selected.lng,
          confirmed: true,
        },
      ]
    : [];

  return (
    <>
      <PageHead
        description="Boundaries gate the camera and drive every transition. Re-drawing a worked-out pit is routine."
        actions={<Button>
            <Icon name="add" size={16} />
            Add site
          </Button>}
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Entered rate</TableHead>
                <TableHead className="text-right">Observed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SITES.map((s) => (
                <TableRow
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`cursor-pointer ${s.id === selected?.id ? 'bg-accent/40' : ''}`}
                >
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    <Badge variant={s.kind === 'pit' ? 'outline' : 'ghost'} className="capitalize">
                      {s.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.orgId ? orgName(s.orgId) : 'Shared'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Num>{s.loadRatePerHour ? `${s.loadRatePerHour}/h` : '—'}</Num>
                  </TableCell>
                  <TableCell className="text-right">
                    <Num className={s.observedRatePerHour ? 'text-primary' : 'text-muted-foreground'}>
                      {s.observedRatePerHour ? `${s.observedRatePerHour}/h` : 'not yet'}
                    </Num>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="mt-4 text-xs text-muted-foreground">
            The observed rate comes from geofence arrival to load photo, across the last few dozen
            dockets. It replaces the entered rate for future slot spacing — it never rewrites a
            window already posted.
          </p>
        </div>

        <aside className="h-fit rounded-lg border">
          <div className="border-b px-4 py-3">
            <p className="text-sm">{selected?.name ?? 'No sites yet'}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {selected ? `${selected.kind} boundary` : ''}
            </p>
          </div>
          {selected && (
            <div className="border-b">
              <FleetMap sites={mapSites} vehicles={[]} height={260} />
            </div>
          )}
          <div className="flex gap-2 p-3">
            <Button size="sm" variant="secondary" className="flex-1">
            <Icon name="edit_location_alt" size={16} />
            Re-draw
          </Button>
            <Button size="sm" className="flex-1">
            <Icon name="save" size={16} />
            Save revision
          </Button>
          </div>
          <p className="px-4 pb-4 text-xs text-muted-foreground">
            Saving a revision does not alter closed dockets. They keep the boundary that was live
            when they were verified.
          </p>
        </aside>
      </div>
    </>
  );
}
