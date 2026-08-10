-- KGP Bazaar Seed Data (Development Only)
-- Fake students, listings, wanted requests, reports, announcements

-- 1. Insert fake auth users and matching profiles
-- User IDs
-- Admin: 00000000-0000-0000-0000-000000000001 (Prateek)
-- Students 2..10: 00000000-0000-0000-0000-000000000002..10

do $$
declare
  v_i int;
  v_uid uuid;
  v_email text;
  v_name text;
  v_roll text;
  v_hall text;
  v_phone text;
  v_halls text[] := array['Azad', 'Patel', 'Nehru', 'RK', 'RP', 'LLR', 'MMM', 'VS', 'HJB', 'Nivedita'];
  v_names text[] := array[
    'Prateek Sharma', 'Aarav Gupta', 'Ananya Roy', 'Rohan Mehta', 'Isha Verma',
    'Kabir Singh', 'Diya Patel', 'Aditya Kumar', 'Sneha Banerjee', 'Vikram Das'
  ];
  v_rolls text[] := array[
    '22CS10045', '22EE10012', '23EC10088', '21ME10034', '22CH10056',
    '23CE10021', '22MA10078', '21BT10009', '23PH10065', '22CY10043'
  ];
begin
  for v_i in 1..10 loop
    v_uid := ('00000000-0000-0000-0000-00000000000' || case when v_i = 10 then 'a' else v_i::text end)::uuid;
    if v_i = 1 then
      v_email := 'pepperjet@kgpian.iitkgp.ac.in';
    else
      v_email := 'student' || v_i || '@kgpian.iitkgp.ac.in';
    end if;

    v_name := v_names[v_i];
    v_roll := v_rolls[v_i];
    v_hall := v_halls[v_i];
    v_phone := '+91999990000' || (v_i - 1)::text;

    -- Insert profile directly
    insert into public.profiles (
      id, email, full_name, roll_number, hall_of_residence, whatsapp_number,
      is_profile_complete, is_admin, is_banned
    ) values (
      v_uid, v_email, v_name, v_roll, v_hall, v_phone,
      true, (v_i = 1), false
    ) on conflict (id) do update set
      full_name = excluded.full_name,
      roll_number = excluded.roll_number,
      hall_of_residence = excluded.hall_of_residence,
      whatsapp_number = excluded.whatsapp_number,
      is_profile_complete = true,
      is_admin = excluded.is_admin;
  end loop;
end $$;

-- 2. Insert 30 Seed Listings
insert into public.listings (
  id, user_id, title, description, category, price, is_negotiable, condition, photo_paths, hall_of_residence, status, is_pinned, created_at
) values
-- Cycles (5)
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Hero Hawk 21-Speed Cycle', 'Great condition cycle with working gears and new tyres. Perfect for commuting from Azad to Nalanda.', 'cycles', 3500, true, 'like_new', array['00000000-0000-0000-0000-000000000002/l1/0.webp'], 'Patel', 'active', true, now() - interval '1 hour'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'BTwin Riverside 120', 'Hybrid cycle, well maintained, comes with ring lock and front basket.', 'cycles', 5500, false, 'good', array['00000000-0000-0000-0000-000000000003/l2/0.webp'], 'Nehru', 'active', false, now() - interval '2 hours'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Atlas Single Speed Bicycle', 'Basic campus cycle, minor rust on chain but rides smooth.', 'cycles', 1200, true, 'fair', array['00000000-0000-0000-0000-000000000004/l3/0.webp'], 'RK', 'active', false, now() - interval '5 hours'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Firefox Target 21S MTB', 'Geared mountain bike, disc brakes, front suspension.', 'cycles', 7500, true, 'like_new', array['00000000-0000-0000-0000-000000000005/l4/0.webp'], 'RP', 'active', false, now() - interval '1 day'),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Hercules Roadeo Hardliner', 'Solid cycle for daily hall to department travel.', 'cycles', 2800, false, 'good', array['00000000-0000-0000-0000-000000000006/l5/0.webp'], 'LLR', 'sold', false, now() - interval '3 days'),

-- Books & Academics (5)
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', 'CLRS Introduction to Algorithms 3rd Ed', 'Standard textbook for CS algorithms. Clean pages, no highlights.', 'books', 600, true, 'like_new', array['00000000-0000-0000-0000-000000000007/l6/0.webp'], 'MMM', 'active', false, now() - interval '3 hours'),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', 'Erwin Kreyszig Advanced Engineering Math', '10th Edition. Essential for 1st/2nd year math courses.', 'books', 450, false, 'good', array['00000000-0000-0000-0000-000000000008/l7/0.webp'], 'VS', 'active', false, now() - interval '6 hours'),
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000009', 'GATE CS Made Easy Package 2024', 'Complete set of GATE notes and practice workbooks.', 'books', 1500, true, 'like_new', array['00000000-0000-0000-0000-000000000009/l8/0.webp'], 'HJB', 'active', false, now() - interval '12 hours'),
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-00000000000a', 'Organic Chemistry by Morrison & Boyd', 'Classic organic chemistry reference text.', 'books', 350, true, 'fair', array['00000000-0000-0000-0000-00000000000a/l9/0.webp'], 'Nivedita', 'active', false, now() - interval '2 days'),
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'Fundamentals of Physics - Halliday & Resnick', '1st year physics textbook in good condition.', 'books', 400, false, 'good', array['00000000-0000-0000-0000-000000000002/l10/0.webp'], 'Patel', 'active', false, now() - interval '4 days'),

-- Electronics (5)
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003', 'Logitech MX Master 3S Mouse', 'Wireless ergonomic mouse with quiet clicks. Includes Unifying receiver.', 'electronics', 4200, true, 'like_new', array['00000000-0000-0000-0000-000000000003/l11/0.webp'], 'Nehru', 'active', false, now() - interval '30 mins'),
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000004', 'Casio fx-991EX ClassWiz Calculator', 'Scientific calculator mandatory for exam use. Works perfectly.', 'electronics', 850, false, 'like_new', array['00000000-0000-0000-0000-000000000004/l12/0.webp'], 'RK', 'active', false, now() - interval '4 hours'),
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000005', 'Dell 24" FHD Monitor (SE2422H)', 'Clean display, HDMI input, perfect dual monitor setup for hall room.', 'electronics', 5800, true, 'good', array['00000000-0000-0000-0000-000000000005/l13/0.webp'], 'RP', 'active', false, now() - interval '8 hours'),
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000006', 'JBL Go 3 Portable Bluetooth Speaker', 'Compact waterproof speaker with great bass.', 'electronics', 1400, true, 'like_new', array['00000000-0000-0000-0000-000000000006/l14/0.webp'], 'LLR', 'active', false, now() - interval '1 day'),
('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000007', 'TP-Link AC1200 Wi-Fi Router', 'Dual band gigabit router for hall room connection.', 'electronics', 1100, false, 'good', array['00000000-0000-0000-0000-000000000007/l15/0.webp'], 'MMM', 'active', false, now() - interval '3 days'),

-- Room Essentials (5)
('10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000008', 'Crompton 1200mm Pedestal Fan', 'High speed standing fan. Essential for Kharagpur summer.', 'room_essentials', 1300, true, 'good', array['00000000-0000-0000-0000-000000000008/l16/0.webp'], 'VS', 'active', false, now() - interval '2 hours'),
('10000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000009', 'Orthopedic Foam Mattress (Single Bed)', '3 inch thickness, fits standard KGP hall cot perfectly.', 'room_essentials', 1800, true, 'like_new', array['00000000-0000-0000-0000-000000000009/l17/0.webp'], 'HJB', 'active', false, now() - interval '5 hours'),
('10000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-00000000000a', 'Study Lamp with Flexible Neck', 'LED desk lamp with 3 brightness modes.', 'room_essentials', 350, false, 'like_new', array['00000000-0000-0000-0000-00000000000a/l18/0.webp'], 'Nivedita', 'active', false, now() - interval '10 hours'),
('10000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000002', 'Plastic Folding Table & Stool', 'Portable study table for room use.', 'room_essentials', 500, true, 'fair', array['00000000-0000-0000-0000-000000000002/l19/0.webp'], 'Patel', 'active', false, now() - interval '2 days'),
('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000003', 'Cloth Drying Stand (Stainless Steel)', 'Foldable drying rack, sturdy construction.', 'room_essentials', 650, false, 'good', array['00000000-0000-0000-0000-000000000003/l20/0.webp'], 'Nehru', 'active', false, now() - interval '5 days'),

-- Lab & Course Gear (5)
('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000004', 'White Lab Coat (Size L)', '100% cotton lab coat required for Chemistry and Bio labs.', 'lab_gear', 250, false, 'like_new', array['00000000-0000-0000-0000-000000000004/l21/0.webp'], 'RK', 'active', false, now() - interval '1 hour'),
('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000005', 'Engineering Drawing Board & Mini Drafter', 'Complete ED kit with mini drafter, clips, and carrying bag.', 'lab_gear', 750, true, 'good', array['00000000-0000-0000-0000-000000000005/l22/0.webp'], 'RP', 'active', false, now() - interval '7 hours'),
('10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000006', 'Arduino Uno Starter Kit with Components', 'Includes breadboard, jumper wires, sensors, LEDs and servos.', 'lab_gear', 950, true, 'like_new', array['00000000-0000-0000-0000-000000000006/l23/0.webp'], 'LLR', 'active', false, now() - interval '14 hours'),
('10000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000007', 'Safety Goggles and Nitrile Gloves Set', 'Lab safety gear kit for chemistry practicals.', 'lab_gear', 150, false, 'brand_new', array['00000000-0000-0000-0000-000000000007/l24/0.webp'], 'MMM', 'active', false, now() - interval '2 days'),
('10000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000008', 'Soldering Iron Kit 60W with Flux', 'Includes stand, solder wire, desoldering pump.', 'lab_gear', 350, true, 'good', array['00000000-0000-0000-0000-000000000008/l25/0.webp'], 'VS', 'active', false, now() - interval '4 days'),

-- Other / Misc (5)
('10000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000009', 'Acoustic Guitar (Kadence Frontier)', '40 inch acoustic guitar, comes with padded bag and picks.', 'other', 2600, true, 'good', array['00000000-0000-0000-0000-000000000009/l26/0.webp'], 'HJB', 'active', false, now() - interval '3 hours'),
('10000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-00000000000a', 'Decathlon Badminton Racket Pair', 'Two aluminium rackets with 3 shuttlecocks.', 'other', 700, false, 'like_new', array['00000000-0000-0000-0000-00000000000a/l27/0.webp'], 'Nivedita', 'active', false, now() - interval '9 hours'),
('10000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000002', 'Wildcraft 45L Duffel Backpack', 'Large capacity travel bag for home visits.', 'other', 1200, true, 'good', array['00000000-0000-0000-0000-000000000002/l28/0.webp'], 'Patel', 'active', false, now() - interval '1 day'),
('10000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000003', 'Steel Kettle 1.5L (Milton)', 'Electric kettle for hot water and instant noodles.', 'other', 550, false, 'like_new', array['00000000-0000-0000-0000-000000000003/l29/0.webp'], 'Nehru', 'active', false, now() - interval '2 days'),
('10000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000004', 'Cosco Football (Size 5)', 'Standard match ball, inflated and ready to play.', 'other', 450, true, 'good', array['00000000-0000-0000-0000-000000000004/l30/0.webp'], 'RK', 'active', false, now() - interval '3 days')
on conflict (id) do nothing;

-- 3. Insert 8 Wanted Requests
insert into public.wanted_requests (
  id, user_id, title, description, category, max_budget, hall_of_residence, status, created_at
) values
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Urgent: Looking for Geared Cycle', 'Need a good condition geared cycle before end-sems start.', 'cycles', 4500, 'Patel', 'open', now() - interval '2 hours'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Looking for Microprocessor 8085 Book by Gaonkar', 'Need Ramesh Gaonkar Microprocessor book for EC course.', 'books', 300, 'Nehru', 'open', now() - interval '4 hours'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Need Working Pedestal Fan', 'Any standing fan in working condition needed for summer.', 'room_essentials', 1000, 'RK', 'open', now() - interval '6 hours'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'HDMI to VGA Adapter wanted', 'Need adapter to connect old hall monitor.', 'electronics', 250, 'RP', 'open', now() - interval '1 day'),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Chemistry Lab Coat Size M', 'Clean lab coat needed for 1st year chemistry lab.', 'lab_gear', 200, 'LLR', 'open', now() - interval '1 day'),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', 'Kettle for Tea / Instant Noodles', 'Looking for 1L+ electric kettle.', 'other', 400, 'MMM', 'open', now() - interval '2 days'),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', 'Raspberry Pi 4 Model B (4GB/8GB)', 'Need Pi 4 for final year project work.', 'electronics', 3500, 'VS', 'open', now() - interval '3 days'),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000009', 'Foam Mattress Single', 'Single bed mattress needed in clean condition.', 'room_essentials', 1200, 'HJB', 'fulfilled', now() - interval '5 days')
on conflict (id) do nothing;

-- 4. Insert 3 Reports
insert into public.reports (
  id, reporter_id, listing_id, reason, details, status, created_at
) values
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'already_sold', 'Item was marked sold offline, please update.', 'pending', now() - interval '1 hour'),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'wrong_category', 'This should be in Electronics.', 'pending', now() - interval '3 hours'),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 'spam_scam', 'Suspiciously high price asked.', 'dismissed', now() - interval '1 day')
on conflict (id) do nothing;

-- 5. Insert 1 Announcement
insert into public.announcements (
  id, message, type, starts_at, is_active, created_by
) values (
  '40000000-0000-0000-0000-000000000001',
  'Welcome to KGP Bazaar! Buy, sell and request items across halls of residence.',
  'info',
  now(),
  true,
  '00000000-0000-0000-0000-000000000001'
) on conflict (id) do nothing;
