# SkateFlow Beta Test Checklist

Date: Saturday, February 21, 2026
Build owner: __________________
App version/build hash: __________________

## 1) Pre-Flight (Before Testers Join)
- [ ] Freeze features (bug fixes only)
- [ ] Run `npm run build` with no errors
- [ ] Run `npm run dev -- --host`
- [ ] Confirm local URL opens on host machine
- [ ] Confirm phone/tablet are on same Wi-Fi network
- [ ] Prepare backup reset plan if app state gets corrupted

## 2) Devices Under Test
- [ ] Mac + Chrome
- [ ] iPhone + Safari
- [ ] iPad + Safari
- [ ] Android + Chrome

Tester name(s): __________________

## 3) Core Smoke Flow (Run on each device)
1. Open app and log in with PIN
- [ ] Pass

2. Log session
- [ ] Select skater
- [ ] Add landed/missed reps
- [ ] Save session card
- [ ] Pass

3. Media flow
- [ ] Upload photo
- [ ] Upload video
- [ ] Trim/compress video
- [ ] Save session with media
- [ ] Pass

4. Cards flow
- [ ] Session card renders with media
- [ ] Edit session card and save
- [ ] Delete a session card
- [ ] Pass

5. Contest flow
- [ ] Add contest run
- [ ] Add tricks + landed checkbox + notes
- [ ] Upload run media
- [ ] Reorder runs
- [ ] Pass

6. Coach flow
- [ ] Add coach demo media for skater
- [ ] Confirm coach/parent can upload
- [ ] Pass

7. Calendar flow
- [ ] Add practice event (.ics export)
- [ ] Import .ics event
- [ ] Pass

8. Settings + safety
- [ ] Light mode readable
- [ ] Dark mode readable
- [ ] Export backup JSON
- [ ] Import backup JSON
- [ ] Run health check
- [ ] Pass

9. Park + weather
- [ ] Search park/city
- [ ] Save park
- [ ] Fetch weather + forecast
- [ ] Apply park to session draft
- [ ] Pass

## 4) PWA / Mobile Install
- [ ] iPhone: Add to Home Screen tested
- [ ] iPad: Add to Home Screen tested
- [ ] Android: Add to Home Screen tested
- [ ] Launch from home icon works

## 5) Go / No-Go
Go only if all are true:
- [ ] No white screens/crashes
- [ ] No data loss in normal usage
- [ ] Save/edit/delete works
- [ ] New media appears correctly after save

Blockers found:
- [ ] Yes
- [ ] No

Decision:
- [ ] GO
- [ ] NO-GO

Owner signoff: __________________
