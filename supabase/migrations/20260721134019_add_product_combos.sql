alter table public.products
  add column if not exists product_kind text not null default 'single',
  add column if not exists combo_original_price numeric null,
  add column if not exists combo_day_label text null,
  add column if not exists combo_highlight boolean not null default false,
  add column if not exists combo_style text not null default 'brush';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_product_kind_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_product_kind_check
      check (product_kind in ('single', 'combo'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_combo_style_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_combo_style_check
      check (combo_style in ('brush', 'compact'));
  end if;
end $$;

create table if not exists public.product_combo_items (
  combo_product_id uuid not null references public.products(id) on delete cascade,
  item_product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric not null default 1,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  primary key (combo_product_id, item_product_id),
  constraint product_combo_items_no_self_reference check (combo_product_id <> item_product_id),
  constraint product_combo_items_quantity_positive check (quantity > 0)
);

create index if not exists idx_product_combo_items_combo
  on public.product_combo_items(combo_product_id, sort_order);

create index if not exists idx_product_combo_items_item
  on public.product_combo_items(item_product_id);

create or replace function public.validate_product_combo_item()
returns trigger
language plpgsql
as $$
declare
  combo_company uuid;
  combo_kind text;
  item_company uuid;
begin
  select company_id, product_kind
    into combo_company, combo_kind
  from public.products
  where id = new.combo_product_id;

  select company_id
    into item_company
  from public.products
  where id = new.item_product_id;

  if combo_company is null or item_company is null then
    raise exception 'Produto do combo nao encontrado.';
  end if;

  if combo_kind <> 'combo' then
    raise exception 'O produto principal precisa estar marcado como combo.';
  end if;

  if combo_company <> item_company then
    raise exception 'Os itens do combo precisam ser da mesma empresa.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_product_combo_item on public.product_combo_items;
create trigger trg_validate_product_combo_item
before insert or update on public.product_combo_items
for each row execute function public.validate_product_combo_item();

alter table public.product_combo_items enable row level security;

drop policy if exists "Public reads active combo items" on public.product_combo_items;
create policy "Public reads active combo items"
on public.product_combo_items
for select
to public
using (
  exists (
    select 1
    from public.products combo
    where combo.id = product_combo_items.combo_product_id
      and (combo.active = true or user_has_company(combo.company_id))
  )
);

drop policy if exists "Company users manage combo items" on public.product_combo_items;
create policy "Company users manage combo items"
on public.product_combo_items
for all
to public
using (
  exists (
    select 1
    from public.products combo
    where combo.id = product_combo_items.combo_product_id
      and user_has_company(combo.company_id)
  )
)
with check (
  exists (
    select 1
    from public.products combo
    join public.products item on item.id = product_combo_items.item_product_id
    where combo.id = product_combo_items.combo_product_id
      and combo.product_kind = 'combo'
      and combo.company_id = item.company_id
      and user_has_company(combo.company_id)
  )
);
