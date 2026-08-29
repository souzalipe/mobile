import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Categoria } from '@/types/database';

/** Categorias padrão do sistema + as customizadas do usuário (RLS já filtra). */
export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    supabase
      .from('categorias')
      .select('*')
      .order('nome')
      .then(({ data }) => {
        if (ativo) {
          setCategorias(data ?? []);
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  return { categorias, loading };
}
