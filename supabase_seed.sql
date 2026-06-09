-- ZOESTRENGTH Seed Data
-- Run AFTER schema migration

-- Programs
insert into public.programs (slug, name, tagline, description, duration_weeks, days_per_week, category, color, text_color, is_published, sort_order)
values
  ('strng', 'STRNG', 'Get seriously strong', 'Heavy compound lifting built for women who want to get seriously strong. 4 days/week, progressive overload, SIT finishers.', 8, 4, 'strength', '#C8F500', '#0D0D0D', true, 1),
  ('cycle-synched-reset', 'Cycle Synched Reset', 'Train with your hormones', 'Training and recovery mapped to your cycle phases. Work with your hormones, not against them.', 4, 3, 'cycle', '#FF3CAC', '#FFFFFF', true, 2),
  ('10k-plan', '10K Plan', 'Run your strongest 10K', 'Run your strongest 10K with integrated strength work. No junk miles — every session has a purpose.', 10, 5, 'hybrid', '#1B6B7B', '#FFFFFF', true, 3);

-- Weeks for STRNG (8 weeks)
insert into public.weeks (program_id, week_number, title, is_deload)
select
  (select id from public.programs where slug = 'strng'),
  generate_series,
  case when generate_series = 4 then 'Deload Week'
       when generate_series = 8 then 'Deload Week'
       else 'Week ' || generate_series
  end,
  case when generate_series in (4, 8) then true else false end
from generate_series(1, 8);
