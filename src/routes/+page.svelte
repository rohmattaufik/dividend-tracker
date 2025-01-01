<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/firebase';
  import { user } from '$lib/stores/auth';
  import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
  import { allDividends } from '$lib/stores/dividends';
  import type { Dividend } from '$lib/types';

  let isModalOpen = false;
  
  let newDividend: Dividend = {
    id: null,
    userId: '',
    date: '',
    stock: '',
    amount: 0
  };

  let isEditing = false;
  let editingDividendId: number | null = null;

  function handleEdit(dividend: Dividend) {
    isEditing = true;
    editingDividendId = dividend.id;
    newDividend = { ...dividend };
    isModalOpen = true;
  }

  function handleAddClick() {
    isModalOpen = true;
    isEditing = false;
    newDividend = {
      id: null,
      userId: '',
      date: '',
      stock: '',
      amount: 0
    };
  }

  async function handleSubmit() {
    if (!$user) return;
    
    const dividendWithUser = {
      ...newDividend,
      userId: $user.uid
    };

    if (isEditing) {
      $allDividends = $allDividends.map(div => 
        div.id === editingDividendId ? dividendWithUser : div
      );
    } else {
      $allDividends = [...$allDividends, { ...dividendWithUser, id: Date.now() }];
    }
    
    newDividend = {
      id: null,
      userId: '',
      date: '',
      stock: '',
      amount: 0
    };
    isEditing = false;
    editingDividendId = null;
    isModalOpen = false;
  }

  function handleClose() {
    isModalOpen = false;
  }

  $: totalAmount = $allDividends.reduce((sum, div) => sum + div.amount, 0);
  
  let selectedYear: string = new Date().getFullYear().toString();

  $: years = [...new Set($allDividends.map(div => div.date.split('-')[0]))].sort((a, b) => b.localeCompare(a));
  
  $: selectedYearTotal = $allDividends
    .filter(div => div.date.startsWith(selectedYear))
    .reduce((sum, div) => sum + div.amount, 0);

  let filterYear = '';
  let filterStock = '';

  $: stocks = [...new Set($allDividends.map(div => div.stock))].sort();
  
  $: filteredDividends = $allDividends
    .filter(div => filterYear ? div.date.startsWith(filterYear) : true)
    .filter(div => filterStock ? div.stock === filterStock : true)
    .sort((a, b) => b.date.localeCompare(a.date));

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      user.set(result.user);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
      user.set(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  let isLoading = true;

  onMount(async () => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      user.set(currentUser);
      
      if (currentUser) {
        try {
          const response = await fetch(`/api/dividends?userId=${currentUser.uid}`);
          const data = await response.json();
          allDividends.set(data);
        } catch (error) {
          console.error('Error fetching dividends:', error);
        }
      }
      isLoading = false;
    });

    return () => unsubscribe();
  });
</script>

{#if $user}
  <div class="container mx-auto p-4">
    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    {:else}
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-4">
          <h1 class="text-3xl font-bold">Dividend Tracker</h1>
          <button
            on:click={handleSignOut}
            class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
        <button
          on:click={handleAddClick}
          class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Dividend
        </button>
      </div>

      {#if isModalOpen}
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">{isEditing ? 'Edit' : 'Add New'} Dividend</h2>
              <button
                on:click={handleClose}
                class="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form on:submit|preventDefault={handleSubmit} class="space-y-4">
              <div>
                <label for="date" class="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  id="date"
                  bind:value={newDividend.date}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label for="stock" class="block text-sm font-medium text-gray-700">Stock Symbol</label>
                <input
                  type="text"
                  id="stock"
                  bind:value={newDividend.stock}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label for="amount" class="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  id="amount"
                  bind:value={newDividend.amount}
                  step="0.01"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div class="flex justify-end gap-4">
                <button
                  type="button"
                  on:click={handleClose}
                  class="rounded-md px-4 py-2 text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {isEditing ? 'Update' : 'Add'} Dividend
                </button>
              </div>
            </form>
          </div>
        </div>
      {/if}

      <div class="mt-8">
        <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold text-gray-700">Total Dividends</h3>
            <p class="text-2xl font-bold text-blue-600">
              Rp {totalAmount.toLocaleString('id-ID')}
            </p>
          </div>
          
          <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold text-gray-700">Yearly Breakdown</h3>
            <div class="mt-2">
              <select
                bind:value={selectedYear}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {#each years as year}
                  <option value={year}>{year}</option>
                {/each}
              </select>
              <div class="mt-4 flex justify-between items-center">
                <span>Total for {selectedYear}:</span>
                <span class="text-xl font-medium text-blue-600">
                  Rp {selectedYearTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <h2 class="mb-4 text-2xl font-semibold">Dividend History</h2>
        <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="filterYear" class="block text-sm font-medium text-gray-700">Filter by Year</label>
            <select
              id="filterYear"
              bind:value={filterYear}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {#each years as year}
                <option value={year}>{year}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="filterStock" class="block text-sm font-medium text-gray-700">Filter by Stock</label>
            <select
              id="filterStock"
              bind:value={filterStock}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Stocks</option>
              {#each stocks as stock}
                <option value={stock}>{stock}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stock
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              {#each filteredDividends as dividend}
                <tr>
                  <td class="whitespace-nowrap px-6 py-4">{dividend.date}</td>
                  <td class="whitespace-nowrap px-6 py-4">{dividend.stock}</td>
                  <td class="whitespace-nowrap px-6 py-4">
                    Rp {dividend.amount.toLocaleString('id-ID')}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4">
                    <button
                      on:click={() => handleEdit(dividend)}
                      class="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-6">Welcome to Dividend Tracker</h1>
      <button
        on:click={signInWithGoogle}
        class="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 flex items-center gap-2"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" class="w-5 h-5" />
        Sign in with Google
      </button>
    </div>
  </div>
{/if}
